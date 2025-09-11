import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, TextProps, ViewStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextProps['style'];
}

const Button: React.FC<ButtonProps> = ({ title, onPress, buttonStyle, textStyle, ...props }) => {
  return (
    <TouchableOpacity style={[styles.button, buttonStyle]} onPress={onPress} {...props}>
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Button;
