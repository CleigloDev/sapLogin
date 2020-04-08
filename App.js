import React from 'react';
import {View, Text} from 'react-native';
import WebView from 'react-native-webview';
import base64 from 'react-native-base64';

const MainLogic = () => {

  parseURLParams = (sUrl) => {
    var url = sUrl;

    var regex = /[?&]([^=#]+)=([^&#]*)/g,
      params = {},
      match;
    while (match = regex.exec(url)) {
      params[match[1]] = match[2];
    }

    return params;
  }

  _test = (oEvent) => {
    const url = oEvent.url;

// parseURLParams is a pseudo function.
// Make sure to write your own function or install a package
const params = parseURLParams(url);
let headers = new Headers();
headers.set('Authorization', 'Basic ' + base64.encode("sb-com-saplogin-dev!t34623" + ":" + "1cGpdkNZytfJSde0oSiSOgzG9lM="));
console.log("headers"+ headers);

if (params.code) {
  // Save token for native requests & move to the next screen
  console.log(params.code);

  fetch("https://p2000953797trial.authentication.eu10.hana.ondemand.com/oauth/token?"+
    "grant_type=authorization_code&code="+params.code+"&redirect_uri=https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com", {method:'GET',
    headers: headers,
    //credentials: 'user:passwd'
   })
    .then(res => {console.log(res); return res.json()})
    .then(response => console.log(response))
    .catch(err => {
      alert(err);
    });
}
}

  return (
    <View style={{flex: 1}}>
      <WebView 
       onNavigationStateChange={_test}
       source={{uri: 'https://p2000953797trial.authentication.eu10.hana.ondemand.com/oauth/authorize?response_type=code&client_id=sb-com-saplogin-dev!t34623&redirect_uri=https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com'}}/>
    </View>
  );
};

export default MainLogic;