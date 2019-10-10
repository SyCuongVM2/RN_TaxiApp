import React, { useState, useEffect } from 'react';
import { Keyboard, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import PolyLine from '@mapbox/polyline';

import apiKey from '../google_api_key';

let watchId = null;

const GenericContainer = (WrappedComponent) => (props) => {
  const [states, setStates] = useState({
    latitude: null,
    longitude: null,
    pointCoords: [],
    routeResponse: {}
  });

  useEffect(() => {
    //Get current location and set initial region to this
    let granted = false;
    if (Platform.OS === "ios") {
      granted = true;
    } else {
      granted = checkAndroidPermissions();
    }
    if (granted) {
      watchId = Geolocation.watchPosition(position => {
          setStates({
            ...states,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        error => console.log(error),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 }
      );
    }
  }, [Geolocation]);

  useEffect(() => {
    return () => {
      Geolocation.clearWatch(watchId);
    }
  }, []);

  const checkAndroidPermissions = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Taxi App",
          message: "Taxi App needs to use your location to show routes and get taxis"
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const getRouteDirections = async (destinationPlaceId, destinationName) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${
          states.latitude
        },${
          states.longitude
        }&destination=place_id:${destinationPlaceId}&key=${apiKey}`
      );
      const json = await response.json();
      const points = PolyLine.decode(json.routes[0].overview_polyline.points);
      const pointCoords = points.map(point => {
        return { latitude: point[0], longitude: point[1] };
      });

      setStates({
        ...states,
        pointCoords,
        routeResponse: json
      });
      Keyboard.dismiss();

      return destinationName;
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <WrappedComponent
      getRouteDirections={getRouteDirections}
      latitude={states.latitude}
      longitude={states.longitude}
      pointCoords={states.pointCoords}
      routeResponse={states.routeResponse}
      {...props}
    />
  );
}

export default GenericContainer;