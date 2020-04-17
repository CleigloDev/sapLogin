import React, {useEffect, useState} from 'react';
import {View, Text, SafeAreaView, AsyncStorage, Button, Platform, TextInput, FlatList} from 'react-native';
import WebView from 'react-native-webview';
import base64 from 'react-native-base64';
import RNSimpleCrypto from "react-native-simple-crypto";
import { sha256 } from 'react-native-sha256';
const base64js = require('base64-js');
import CookieManager from '@react-native-community/cookies';


const oAuthParams = { // neo params for token
  client_id: "905fd317-7397-420f-a7c5-e26aff8dc5b8",
  app_id: "com.loginsap",
  mobileServiceHost_uri: "https://hcpms-p2000953797trial.hanatrial.ondemand.com",
  redirect_uri: "https://oauthasservices-p2000953797trial.hanatrial.ondemand.com",
  authorize_uri: "https://oauthasservices-p2000953797trial.hanatrial.ondemand.com/oauth2/api/v1/authorize",
  token_uri: "https://oauthasservices-p2000953797trial.hanatrial.ondemand.com/oauth2/api/v1/token",
  deviceRegistration_path: "/odata/applications/v4/com.loginsap/Connections",
  logout_uri: "/mobileservices/sessions/logout",
  logout_method: "POST"
};

const oAuthParamsCF = { // cf params for token
  client_id: "371b34f5-a548-4083-aad0-bbfdb9f9236b",
  app_id: "com.saplogin",
  mobileServiceHost_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com",
  redirect_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com",
  authorize_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com/oauth2/api/v1/authorize",
  token_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com/oauth2/api/v1/token",
  deviceRegistration_path: "/odata/applications/v4/com.saplogin/Connections",
  logout_uri: "/mobileservices/sessions/logout",
  logout_method: "GET"
};//collections: Persons, Products, ProductDetail, Suppliers, Categories

let requestPending = false;


const MainLogic = () => {
  const [webViewComp, setWebView] = useState(null);
  const [verifier, setVerifier] = useState("");
  const [challenge, setChallange] = useState("");
  const [authInfo, setAuthInfo] = useState(null);
  const [tokenDevice, setTokenDevice] = useState("");
  const [cookieSession, setCookieSession] = useState("");
  const [value, onChangeText] = useState("");
  const [dataArray, setDataArray] = useState([]);

  useEffect(() => {
    _getToken().then(() => {
      _requestLogin();
    });
  }, []);

  _requestLogin = () => {
    if(!authInfo){
      _generateCodeAndVerifier().then(() => {
        let vebViewUri = oAuthParams.authorize_uri + "?response_type=code&client_id="+ oAuthParams.client_id + 
          "&token_format=opaque"+
          "&code_challenge=" + challenge + "&code_challenge_method=S256&redirect_uri=" + oAuthParams.redirect_uri;
        //console.log(vebViewUri);
        let webViewVar = <WebView 
          cacheEnabled={false}
          incognito={true}
          onNavigationStateChange={_navigationUriChange} 
          source={{uri: vebViewUri}}/>
        setWebView(webViewVar);
      })
      .catch((err) => {
        alert("Error cannot generate challange and verifier, see logs for more");
      });
    }
  };

  parseURLParams = (sUrl) => {
    var url = sUrl;

    var regex = /[?&]([^=#]+)=([^&#]*)/g,
      params = {},
      match;
    while (match = regex.exec(url)) {
      params[match[1]] = match[2];
    }

    return params;
  };

  base64URLEncode = (data) => {
    if (typeof data === "string"){
      return base64.encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }
    if (data instanceof Uint8Array) {
      const str = base64js.fromByteArray(data);
      return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    if (!ArrayBuffer.isView(data)) {
      throw new Error('data must be ArrayBuffer or typed array');
    }
    const {buffer, byteOffset, byteLength} = data;
    const str = base64js.fromByteArray(new Uint8Array(buffer, byteOffset, byteLength));
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  _generateCodeAndVerifier = () => {
    return new Promise((resolve, reject) => {
      try{
        if(Platform.OS === "android"){
          _defineChallengeAndroid(resolve);
        }else{
          _defineChallengeIos(resolve);
        }
      }catch(err){
        console.log(err);
        reject(err);
      }
    });
  };

  _defineChallengeAndroid = (fnResolve) => {
    RNSimpleCrypto.SHA.randomBytes(32)
      .then((keyArrayBuffer) => {
      const verifier = base64URLEncode(keyArrayBuffer);
      setVerifier(verifier);
      sha256(verifier).then(hash => {
        const challenge = base64URLEncode(hash);
        //base64.encode(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        setChallange(challenge);
        fnResolve();
      });
    });
  };

  _defineChallengeIos = (fnResolve) => {
    RNSimpleCrypto.utils.randomBytes(32)
      .then((keyArrayBuffer) => {
      const verifier = base64URLEncode(keyArrayBuffer);
      setVerifier(verifier);
      sha256(verifier).then(hash => {
        const challenge = base64URLEncode(hash);
        //base64.encode(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        setChallange(challenge);
        fnResolve();
      });
    });
  }

  _navigationUriChange = (oEvent) => {
    const url = oEvent.url;
    
    const params = parseURLParams(url);

    if (params.code && !requestPending) {
      requestPending = true;
      let headers = new Headers();
      let code = params.code;
      headers.set('Content-type', 'application/x-www-form-urlencoded');
      // Save token for native requests & move to the next screen
      //console.log(params.code);
      let accessTokenUri = oAuthParams.token_uri + "?grant_type=authorization_code&client_id=" + 
        oAuthParams.client_id + "&code_verifier=" + verifier + "&code=" + code + "&redirect_uri=" + 
        oAuthParams.redirect_uri;
      //console.log(accessTokenUri);
      fetch(accessTokenUri, { method: 'Post', headers: headers })
      .then(res => res.json())
      .then(response => {
        //console.log(response);
        setAuthInfo(response);
        _saveSessionInfo(response);
        //console.log(response);
        _registerDevice().then(() => {
          setWebView(null);
        })
        .catch(() => {
          alert("Something went wrong, see console for more info");
        });
      })
      .catch(err => {
        alert(err);
      });
    }
  };

  _getRegistrationToken = async() => {
    try{
      const sTokenDevice = await _getElementFromStorage('registrationToken');
      if(sTokenDevice !== null) {
        setTokenDevice(sTokenDevice);
        return sTokenDevice;
      }
    }catch(err){
      alert("Could not retrive registrtion token");
      console.log(err);
    }
  };

  _getToken = async() => {
    try{
      let oAuthInfo = await _getElementFromStorage('sessionInfo');
      if(oAuthInfo !== null) {
        oAuthInfo = JSON.parse(oAuthInfo);
        setAuthInfo(oAuthInfo);
        //console.log(oAuthInfo);
        return oAuthInfo;
      }
    }catch(err){
      alert("Could not retrive auth info");
      console.log(err);
    }
  };

  _getSessionCookie = async() => {
    try{
      const sSessionCookie = await _getElementFromStorage('sessionCookie');
      if(sSessionCookie !== null) {
        setCookieSession(sSessionCookie);
        return sSessionCookie;
      }
    }catch(err){
      alert("Could not retrieve session cookie");
      console.log(err);
    }
  };

  _getElementFromStorage = async(sElmID) => {
    try{
      const elm = await AsyncStorage.getItem(sElmID);
      return elm;
    }catch(err){
      alert("Could not retrive");
      console.log(err);
    }
  };

  _saveRegistrationToken = async(sRegistrationToken) => {
    await _saveElementToStorage('registrationToken', sRegistrationToken);
  };

  _saveSessionCookie = async(sSessionCookie) => {
    await _saveElementToStorage('sessionCookie', sSessionCookie);
  };

  _saveSessionInfo = async(oAuthInfo) => {
    await _saveElementToStorage('sessionInfo', oAuthInfo);
  };

  _saveElementToStorage = async(sElmID, elm) => {
    try {
      if(typeof elm !== "string"){
        elm = JSON.stringify(elm);
      }
      await AsyncStorage.setItem(sElmID, elm);
    } catch (err) {
      alert("Error saving local information");
      console.log(err);
    }
  };

  _registerDevice = () => {
    return new Promise((resolve, reject) => {
      let headers = new Headers();
      const DeviceType = Platform.OS === "android" ? "Android" : "iPhone";
      headers.set('Content-type', 'application/json');
      headers.set('Authorization', 'Bearer ' + authInfo.access_token);
      //const bodyNeoXml = '<?xml version="1.0" encoding="UTF-8"?><entry xmlns="http://www.w3.org/2005/Atom" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata"><content type="application/xml"><m:properties><d:DeviceType>'+DeviceType+'</d:DeviceType></m:properties></content></entry>';
      const bodyJSON = JSON.stringify({DeviceType});
      fetch(oAuthParams.mobileServiceHost_uri+oAuthParams.deviceRegistration_path, {
        method: "POST", headers: headers, body: bodyJSON,
        credentials: 'include'
      })
      .then(res => {
        if(res.status === 201) { 
          return res.text();
        }else return null;
      })
      .then(response => {
          const deviceToken = response ? _getDeviceTokenFromString(response) : "";
          deviceToken && deviceToken !== "" ? 
            _getSessionCookies().then((cookieSession) => {
              setTokenDevice(deviceToken);
              setCookieSession(cookieSession);
              Promise.all([
                _saveSessionCookie(cookieSession),
                _saveRegistrationToken(deviceToken)
              ])
              .then(() => {alert("Registration token saved success"); resolve()})
            })
          : null;
      })
      .catch(err => {
        alert("Errore nella registrazione del device");
        console.log(err);
        reject();
      })
    })
  };

  _getDeviceTokenFromString = (responseText) => {
    let deviceToken = "";
    try{
      const paresedResponse = JSON.parse(responseText);
      deviceToken = paresedResponse.d.ApplicationConnectionId;
    }catch(err){
      const iApplicationIdPos = responseText.search("<d:ApplicationConnectionId>");
      deviceToken = responseText.substr(iApplicationIdPos+27, responseText.substr(iApplicationIdPos+27).search("<"));
    }

    return deviceToken;
  }

  _logout = () => {
    Promise.all([
      _getSessionCookie(),
      _getRegistrationToken()
    ])
    .then(() => {
      _deleteRegistrationDevice().then(() => {
        Promise.all([
          _invalidateSessionCookie(),
          CookieManager.clearAll()
        ])
        .then(() => {
          //clear every local variables
          setAuthInfo(null);
          setTokenDevice("");
          setCookieSession("");

          //clear every local saved in storage variables
          _saveRegistrationToken("");
          _saveSessionCookie("");
          _saveSessionInfo(null);

          //show login page
          _requestLogin();
          requestPending = false;
        })
        .catch(() => {
          console.log("Error during logout");
        });
      })
      .catch(() => {
        console.log("Error during logout");
      })
    });
  };

  _invalidateSessionCookie = () => {
    return new Promise((resolve, reject) => {
      let headers = new Headers();
      headers.set('Cookie', cookieSession);
      const vebViewUri = oAuthParams.mobileServiceHost_uri+oAuthParams.logout_uri;
      const logoutMethod = oAuthParams.logout_method;
      fetch(vebViewUri, {method: logoutMethod, headers: headers})
      .then(res => res.text())
      .then(response => {
        resolve();
      })
      .catch(err => {
        alert("Error during logout");
        console.log(err);
        reject(err);
      });
    });
  };

  _deleteRegistrationDevice = () => {
    return new Promise((resolve, reject) => {
      let headers = new Headers();
      const registrationToken = tokenDevice;
      headers.set('Authorization', 'Bearer ' + authInfo.access_token);
      headers.set('Cookie', cookieSession);
      const vebViewUri = oAuthParams.mobileServiceHost_uri+oAuthParams.deviceRegistration_path+"('"+registrationToken+"')";
      fetch(vebViewUri, {method: "DELETE", headers: headers})
      .then(res => res.text())
      .then(response => {
        //console.log(response);
        resolve();
      })
      .catch((err) => {
        alert("Error during logout");
        console.log(err);
        reject(err);
      });
    });
  };

  _fetchData = () => {
    if(value !== ""){
      let headers = new Headers();
      headers.set('Authorization', 'Bearer ' + authInfo.access_token);
      //headers.set('Cookie', cookieSession);
      const requestUri = oAuthParams.mobileServiceHost_uri+"/"+oAuthParams.app_id+"/"+value+"?$format=json";
      fetch(requestUri, {
        method: "GET", headers: headers, 
        credentials: 'include'
      })
      .then(res => res.json())
      .then(response => {
        let data = [];
        if(response?.value?.length > 0){
          let aKeys = Object.keys(response.value[0]);
          let sKey0 = aKeys[0];
          let sKey1 = aKeys[1];
          data = response.value.map((oItem) => {
            return Object.assign({}, {key0: oItem[sKey0], key1: oItem[sKey1]});
          });
        }else if(response?.d?.results?.length > 0) {
          let aKeys = Object.keys(response.d.results[0]);
          let sKey0 = aKeys[1];
          let sKey1 = aKeys[2];
          data = response.d.results.map((oItem) => {
            return Object.assign({}, {key0: oItem[sKey0], key1: oItem[sKey1]});
          });
        }else{
          alert("Err during fetching data");
          console.log(JSON.stringify(response));
        }
        setDataArray(data);
      })
      .catch(err => {
        alert("Err during fetching data");
        console.log(err);
      })
    }
  };

  _getSessionCookies = () => {
    return new Promise((resolve, reject) => {
      try{
        CookieManager.get(oAuthParams.mobileServiceHost_uri)
        .then((res) => {
          let cookieString = "";
          for(let key in res){
            cookieString += key+"="+res[key].value+"; ";
          }
          resolve(cookieString);
        });
      }catch(err){
        reject();
      }
    });
  };

  _renderItem = ({item}) => (
    <>
      <Text>{item.key0 + " " + item.key1}</Text>
    </>
  );

  /*<>
    <Text style={{flexShrink: 1}}>{"Token: " + authInfo.access_token}</Text>
    <Text style={{flexShrink: 1}}>{"TokenType: " + authInfo.token_type}</Text>
    <Text style={{flexShrink: 1}}>{"Expire: " + authInfo.expires_in}</Text>
    <Text style={{flexShrink: 1}}>{"RefreshToken: " + authInfo.refresh_token}</Text>
    <Text style={{flexShrink: 1}}>{"Scopes: " + authInfo.scope}</Text>
    <Button title="Register Device" onPress={_registerDevice} />
    <Text style={{flexShrink: 1}}>{"RegistrationToken: " + tokenDevice}</Text>
    <Button title="Get Device Token" onPress={_getRegistrationToken} />
    <Button title="Do Logout" onPress={_logout} />
    <Button title="Get Metadata" onPress={_fetchData} />
  </>*/
  return (
    <SafeAreaView style={{flex: 1}}>
      {webViewComp}
      {!authInfo ? null :
        <>
          <TextInput
            style={{ height: 40, borderColor: 'gray', borderWidth: 1, margin: 10, borderRadius: 5}}
            onChangeText={text => onChangeText(text)}
            placeholder={"Inserisci nome collezione NorthWind"}
            value={value}
          />
          <View style={{flexDirection: "row"}}>
            <View style={{paddingRight: "70%"}}>
              <Button title="Logout" onPress={_logout} />
            </View>
            <Button title="GO!" onPress={_fetchData} />
          </View>
            <FlatList
              data={dataArray}
              renderItem={this._renderItem}
              extraData={dataArray}
            />
        </>
      }
    </SafeAreaView>
  );
};

export default MainLogic;