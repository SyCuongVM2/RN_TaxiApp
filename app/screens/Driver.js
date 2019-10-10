import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, View, ActivityIndicator, Linking, Platform, Alert, Image 
} from 'react-native';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import MapView, { Marker, Polyline } from 'react-native-maps';
import socketIO from 'socket.io-client';

import BottomButton from '../components/BottomButton';

let socket = null;

const Driver = ({ latitude, longitude, getRouteDirections, pointCoords }) => {
  const mapRef = useRef(null);

  const [states, setStates] = useState({
    lookingForPassengers: false,
    passengerFound: false,
    routeResponse: []
  });

  useEffect(() => {
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      stationaryRadius: 50,
      distanceFilter: 50,
      debug: false,
      startOnBoot: false,
      stopOnTerminate: true,
      locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
      interval: 10000,
      fastestInterval: 5000,
      activitiesInterval: 10000,
      stopOnStillActivity: false
    });

    BackgroundGeolocation.on('authorization', status => {
      console.log("[INFO] BackgroundGeolocation authorization status: " + status);
      if (status !== BackgroundGeolocation.AUTHORIZED) {
        setTimeout(() => Alert.alert(
          "App requires location tracking permission",
          "Would you like to open app settings?",
          [
            {
              text: "Yes",
              onPress: () => BackgroundGeolocation.showAppSettings()
            },
            {
              text: "No",
              onPress: () => console.log("No Pressed"),
              style: "cancel"
            }
          ]
        ), 1000);
      }
    });
  }, []);

  const findPassengers = () => {
    
    if (!states.lookingForPassengers) {
      setStates({ ...states, lookingForPassengers: true });
      
      socket = socketIO.connect("http://localhost:5000");
      socket.on("connect", () => {
        socket.emit("passengerRequest");
      });
      
      socket.on("taxiRequest", async routeResponse => {
        setStates({ 
          ...states, 
          lookingForPassengers: false, 
          passengerFound: true,
          routeResponse
        });
        const destination = await getRouteDirections(routeResponse.geocoded_waypoints[0].place_id, "");

        // mapRef.current.fitToCoordinates(pointCoords, {
        //   edgePadding: { top: 140, bottom: 140, left: 20, right: 20 }
        // });
      });
    }
  };

  const acceptPassengerRequest = () => {
    const passengerLocation = pointCoords[pointCoords.length - 1];

    BackgroundGeolocation.on("location", location => {
      socket.emit("driverLocation", {
        latitude: location.latitude,
        longitude: location.longitude
      });
    });

    BackgroundGeolocation.checkStatus(status => {
      if (!status.isRunning) {
        BackgroundGeolocation.start();
      }
    });

    if (Platform.OS === 'ios') {
      Linking.openURL(`http://maps.apple.com/?daddr=${passengerLocation.latitude},${passengerLocation.longitude}`);
    } else {
      Linking.openURL(`geo:0,0?q=${passengerLocation.latitude},${passengerLocation.longitude}(Passenger)`);
    }
  }

  let endMarker = null;
  let startMarker = null;
  let findingPassengerActIndicator = null;
  let passengerSearchText = "FIND PASSENGERS 👥";
  let bottomButtonFunction = findPassengers;

  if (!latitude) return null;

  if (states.lookingForPassengers) {
    passengerSearchText = "FINDING PASSENGERS...";
    findingPassengerActIndicator = (
      <ActivityIndicator
        size="large"
        animating={states.lookingForPassengers}
      />
    );
  }

  if (states.passengerFound) {
    passengerSearchText = "FOUND PASSENGER! ACCEPT RIDE?";
    bottomButtonFunction = acceptPassengerRequest;
  }

  if (pointCoords && pointCoords.length > 0) {
    endMarker = (
      <Marker coordinate={pointCoords[pointCoords.length - 1]}>
        <Image 
          style={{width: 40, height: 40}}
          source={require('../images/person-marker.png')}
        />
      </Marker>
    );
    mapRef.current.fitToCoordinates(pointCoords, {
      edgePadding: { top: 140, bottom: 140, left: 20, right: 20 }
    });
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={{
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
        showsUserLocation={true}
      >
        <Polyline 
          coordinates={pointCoords}
          strokeWidth={4}
          strokeColor="red"
        />
        {endMarker}
        {startMarker}
      </MapView>
      <BottomButton
        onPressFunction={bottomButtonFunction}
        buttonText={passengerSearchText}
      >
        {findingPassengerActIndicator}
      </BottomButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  destinationInput: {
    height: 40,
    borderWidth: 0.5,
    marginTop: 50,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    backgroundColor: "white"
  },
  suggestions: {
    backgroundColor: "white",
    padding: 5,
    fontSize: 18,
    borderWidth: 0.5,
    marginLeft: 5,
    marginRight: 5
  },
  findDriver: {
    backgroundColor: "black",
    marginTop: "auto",
    margin: 20,
    padding: 15,
    paddingLeft: 30,
    paddingRight: 30,
    alignSelf: "center"
  },
  findDriverText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600"
  }
});

export default Driver;