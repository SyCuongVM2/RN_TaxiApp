import React, { useState, useRef } from 'react';
import { 
  StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableHighlight, Image
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import _ from 'lodash';
import socketIO from 'socket.io-client';

import BottomButton from '../components/BottomButton';
import apiKey from '../google_api_key';

const Passenger = ({ latitude, longitude, routeResponse, pointCoords, getRouteDirections }) => {
  const mapRefP = useRef(null);
  
  const [states, setStates] = useState({
    lookingForDriver: false,
    driverIsOnTheWay: false,
    predictions: [],
    driverLocation: [],
    destination: ""
  });

  const onChangeDestination = async (destination) => {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${apiKey}&input=${destination}&location=${latitude},${longitude}&radius=2000`;

    try {
      const result = await fetch(apiUrl);
      const json = await result.json();

      setStates({ 
        ...states,
        destination,
        predictions: json.predictions 
      });
    } catch (err) {
      console.error(err);
    }
  };
  const onChangeDestinationDebounced = _.debounce(onChangeDestination, 1000);

  const requestDriver = async () => {
    setStates({ ...states, lookingForDriver: true });

    const socket = socketIO.connect("http://localhost:5000");
    socket.on("connect", () => {
      socket.emit("taxiRequest", routeResponse);
    });

    socket.on("driverLocation", driverLocation => {
      const t_pointCoords = [...pointCoords, driverLocation];
      mapRefP.current.fitToCoordinates(t_pointCoords, {
        edgePadding: { top: 140, bottom: 140, left: 20, right: 20 }
      });

      setStates({
        ...states,
        lookingForDriver: false,
        driverIsOnTheWay: true,
        driverLocation
      });
    });
  };

  let marker = null;
  let getDriver = null;
  let findingDriverActIndicator = null;
  let driverMarker = null;

  if (!latitude) return null;

  if (states.driverIsOnTheWay) {
    driverMarker = (
      <Marker coordinate={states.driverLocation}>
        <Image 
          source={require('../images/carIcon.png')}
          style={{width: 40, height: 40}}
        />
      </Marker>
    );
  }

  if (states.lookingForDriver) {
    findingDriverActIndicator = (
      <ActivityIndicator 
        size='large'
        animating={states.lookingForDriver}
      />
    );
  }

  if (pointCoords && pointCoords.length > 0) {
    marker = (
      <Marker coordinate={pointCoords[pointCoords.length - 1]} />
    );
    getDriver = (
      <BottomButton 
        onPressFunction={() => requestDriver()}
        buttonText='REQUEST 🚗'
      >
        {findingDriverActIndicator}
      </BottomButton>
    );

    mapRefP.current.fitToCoordinates(pointCoords, {
      edgePadding: { top: 20, bottom: 20, left: 20, right: 20 }
    });
  };

  const predictionsComponent = states.predictions && states.predictions.map(prediction => (
    <TouchableHighlight 
      key={prediction.id} 
      onPress={async () => {
        const destinationName = await getRouteDirections(
          prediction.place_id,
          prediction.structured_formatting.main_text
        );
        setStates({
          ...states,
          predictions: [],
          destination: destinationName
        });
      }}
    >
      <View>
        <Text style={styles.suggestions}>{prediction.structured_formatting.main_text}</Text>
      </View>
    </TouchableHighlight>
  ));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRefP}
        style={styles.map}
        showsMyLocationButton={true}
        initialRegion={{
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
        {marker}
        {driverMarker}
      </MapView>
      <TextInput 
        style={styles.destinationInput}
        placeholder="Enter destination..."
        autoCorrect={false}
        autoCapitalize="none"
        value={states.destination}
        onChangeText={destination => {
          setStates({ ...states, destination });
          onChangeDestinationDebounced(destination);
        }}
      />
      {predictionsComponent}
      {getDriver}
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

export default Passenger;