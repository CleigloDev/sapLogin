import React from 'react';
import {View, Text} from 'react-native';
import WebView from 'react-native-webview';
import base64 from 'react-native-base64';
import RNSimpleCrypto from "react-native-simple-crypto";
import { sha256 } from 'react-native-sha256';
const base64js = require('base64-js');


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

  base64URLEncode = (data) => {
    if (data instanceof ArrayBuffer) {
      data = new Uint8Array(data);
    }
    if (data instanceof Uint8Array) {
      const str = base64js.fromByteArray(data);
      return str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }
    if (!ArrayBuffer.isView(data)) {
      throw new Error('data must be ArrayBuffer or typed array');
    }
    const {buffer, byteOffset, byteLength} = data;
    const str = base64js.fromByteArray(new Uint8Array(buffer, byteOffset, byteLength));
    return str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
  }

  _test = async(oEvent) => {
    const url = oEvent.url;

// parseURLParams is a pseudo function.
// Make sure to write your own function or install a package
RNSimpleCrypto.utils.randomBytes(32)
.then(async(keyArrayBuffer) => {

const verifier = base64URLEncode(keyArrayBuffer);

console.log(keyArrayBuffer);
console.log("verifier:" + verifier);
sha256(verifier).then(hash => {
  console.log("has256"+hash);
  const challenge = base64.encode(hash)
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');
  console.log("challenge:" + challenge);
})
//const challange = base64URLEncode(sha256Hash);
//console.log("challange:" + challange);
});
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