import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

const BottomButton = ({ onPressFunction, buttonText, children }) => {
  return (
    <View style={styles.bottomButton}>
      <TouchableOpacity onPress={() => onPressFunction()}>
        <View>
          <Text style={styles.bottomButtonText}>{buttonText}</Text>
          {children}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomButton: {
    backgroundColor: "black",
    marginTop: "auto",
    margin: 20,
    padding: 15,
    paddingLeft: 30,
    paddingRight: 30,
    alignSelf: "center"
  },
  bottomButtonText: {
    fontSize: 20,
    color: "white",
    fontWeight: "600"
  }
});

export default BottomButton;