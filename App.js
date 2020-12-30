import React, { useState, useEffect, useRef } from 'react';
import { Platform, Text, View, StyleSheet, TouchableHighlight, Alert, Dimensions, } from 'react-native';
import * as Location from 'expo-location';
import MapView, { Polygon, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import Constants from 'expo-constants';
import facade from "./serverFacade";


const MyButton = ({ txt, onPressButton }) => {
  return (
    <TouchableHighlight style={styles.touchable} onPress={onPressButton}>
      <Text style={styles.touchableTxt}>{txt}</Text>
    </TouchableHighlight>
  );
}

export default App = () => {

  //HOOKS
  const [position, setPosition] = useState({ latitude: null, longitude: null })
  const [errorMessage, setErrorMessage] = useState(null);
  const [gameArea, setGameArea] = useState([]);
  const [region, setRegion] = useState(null);
  const [serverIsUp, setServerIsUp] = useState(false);
  const [status, setStatus] = useState("");
  const [clickMarker, setClickMarker] = useState({latitude: null, longitude: null})
  let mapRef = useRef(null);


  useEffect(() => {
    getGameArea();
    getLocationAsync();
  }, [])

  async function getGameArea() {
    // REMEMBER TO TURN ON NGROK ON PORT 3000
    try {
      const area = await facade.fetchGameArea();
      setGameArea(area);
      setServerIsUp(true);
      setStatus("Server is up")
      console.log(area[0].latitude)
    } catch (err) {
      setErrorMessage("Could not fetch GameArea");
    }
    //Fetch gameArea via the facade, and call this method from within (top) useEffect
  }

  getLocationAsync = async () => {
    let { status } = await Location.requestPermissionsAsync();
    if (status !== "granted") {
      setErrorMessage("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
    });
    setPosition({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });

   
    //Request permission for users location, get the location and call this method from useEffect
  };

  /*
  When a press is done on the map, coordinates (lat,lon) are provided via the event object
  */
  onMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    const lon = coordinate.longitude;
    const lat = coordinate.latitude;
    setClickMarker({
      latitude: lat,
      longitude: lon
    });
    try {
      const status = await facade.isUserInArea(lon, lat);
      showStatusFromServer(setStatus, status);
    } catch (err) {
      Alert.alert("Error", "Server could not be reached");
      setServerIsUp(false);
    }
    //Get location from where user pressed on map, and check it against the server
  }

  onCenterGameArea = () => {
    // (RED) Center map around the gameArea fetched from the backend
    Alert.alert("Message", "Should center map around the gameArea")
  }

  sendRealPosToServer = async () => {
    //Upload users current position to the isuserinarea endpoint and present result
    Alert.alert("Message", "Should send users location to the 'isuserinarea' endpoint")
  }




  const info = serverIsUp ? status : " Server is not up";
  return (
    <View style={{ flex: 1, paddingTop: 20, paddingBottom: 10 }}>

      {!region && <Text style={styles.fetching}>
        .. Fetching data</Text>}
      <View style={styles.mapContainer}>
        <MapView style={styles.mapStyle} initialRegion={region} onPress={onMapPress} >
        {gameArea.length > 0 && <Polygon coordinates={gameArea} />}
        {clickMarker.latitude != null && <Marker coordinate={clickMarker} title={"status"} description={info} isPreselected={true} /> }
        </MapView>

        <Text >
          Your position (lat,long): {position.latitude}, {position.longitude}
        </Text>
        <Text >{info}</Text>
      </View>

      <MyButton style={{ flex: 2 }} onPressButton={sendRealPosToServer}
        txt="Upload real Position" />

      <MyButton style={{ flex: 2 }} onPressButton={() => onCenterGameArea()}
        txt="Show Game Area" />
    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  touchable: { backgroundColor: "#4682B4", margin: 3 },
  touchableTxt: { fontSize: 22, textAlign: "center", padding: 5 },

  fetching: {
    fontSize: 35, flex: 14,
    flexDirection: "row",
    justifyContent: 'center',
    alignItems: "center",
    paddingTop: Constants.statusBarHeight
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
    justifyContent: "flex-end"
  },
  mapStyle: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

function showStatusFromServer(setStatus, status) {
  setStatus(status.msg);
  setTimeout(() => setStatus("- - - - - - - - - - - - - - - - - - - -"), 3000);
}
