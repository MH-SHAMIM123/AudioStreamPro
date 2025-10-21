import React from "react";
import { View, Text, Button, ActivityIndicator, StyleSheet } from "react-native";

export default function HomeScreen() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [status, setStatus] = React.useState("Ready");

  const startRecording = () => {
    setIsLoading(true);
    setStatus("Initializing...");
    setTimeout(() => {
      setIsLoading(false);
      setIsRecording(true);
      setStatus("Recording...");
    }, 2000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus("Ready");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AudioStream Pro</Text>
      <Text style={styles.subtitle}>iPhone Version 1</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.status}>{status}</Text>
        {isLoading && <ActivityIndicator size="small" color="#0000ff" />}
      </View>
      
      <View style={styles.buttonContainer}>
        {!isRecording ? (
          <Button
            title={isLoading ? "INITIALIZING..." : "START STREAMING"}
            onPress={startRecording}
            disabled={isRecording || isLoading}
            color="#841584"
          />
        ) : (
          <Button
            title="STOP RECORDING"
            onPress={stopRecording}
            color="#ff0000"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20,
    backgroundColor: "#f5f5f5"
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 10,
    color: "#333"
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: 30,
    color: "#666"
  },
  statusContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },
  status: { 
    fontSize: 18, 
    marginRight: 10,
    color: "#444"
  },
  buttonContainer: { 
    width: "80%" 
  }
});
