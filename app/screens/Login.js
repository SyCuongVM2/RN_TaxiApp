import React, { useState } from 'react';
import { Text, StyleSheet, View, Platform, Image } from 'react-native';
import axios from 'axios';

import LoginForm from '../components/LoginForm';
import baseUrl from '../baseUrl';

axios.defaults.baseURL = baseUrl;

const Login = ({ handleChange }) => {
  const [credentials, setCredentials] = useState({
    email: "cuongvm@gmail.com",
    password: "123456",
    errorMessage: ""
  });

  const handleChangeForm = (name, value) => {
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSignIn = async () => {
    try {
      setCredentials({ 
        ...credentials,
        errorMessage: ""
      });
      const { email, password } = credentials;
      const result = await axios.post("/auth/login", { email, password });
      handleChange("token", result.data.token);
    } catch (err) {
      setCredentials({ 
        ...credentials,
        errorMessage: err.response.data.message
      });
    }
  };

  const handleSignUp = async () => {
    try {
      const { email, password } = credentials;
      await axios.post("/auth/signup", { email, password });
      handleSignIn();
    } catch (err) {
      setCredentials({ 
        ...credentials,
        errorMessage: err.response.data.message
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>React Native Taxi</Text>
      <LoginForm
        email={credentials.email}
        password={credentials.password}
        handleChange={handleChangeForm}
        handleSignIn={handleSignIn}
        handleSignUp={handleSignUp}
      />
      <Text style={styles.errorMessage}>{credentials.errorMessage}</Text>
      <Image source={require('../images/greencar.png')} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3A3743"
  },
  errorMessage: {
    marginHorizontal: 10,
    fontSize: 18,
    color: "#F5D7CC",
    fontWeight: "bold"
  },
  headerText: {
    fontSize: 44,
    textAlign: "center",
    color: "#C1D76D",
    fontFamily: Platform.OS === "android" ? "sans-serif-light" : undefined,
    marginTop: 30,
    fontWeight: "200"
  },
  logo: {
    height: 300,
    width: 300,
    alignSelf: "center"
  }
});

export default Login;