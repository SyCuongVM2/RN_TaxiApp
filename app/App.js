import React, { useState } from 'react';

import Driver from './screens/Driver';
import Passenger from './screens/Passenger';
import Login from './screens/Login';
import DriverOrPassenger from './screens/DriverOrPassenger';
import GenericContainer from './components/GenericContainer';

const App = () => {
  const [mode, setMode] = useState({
    isDriver: false,
    isPassenger: false,
    token: ""
  });

  const DriverWithGenericContainer = GenericContainer(Driver);
  const PassengerWithGenericContainer = GenericContainer(Passenger);

  const handleChange = (name, value) => {
    setMode({ 
      ...mode,
      [name]: value
    });
  }

  if (mode.token === "") {
    return <Login handleChange={handleChange} />
  }

  if (mode.isDriver) {
    return <DriverWithGenericContainer token={mode.token} />
  }
  if (mode.isPassenger) {
    return <PassengerWithGenericContainer token={mode.token} />
  }

  return <DriverOrPassenger handleChange={handleChange} />
};

export default App;