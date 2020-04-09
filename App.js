import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import WebView from 'react-native-webview';
import base64 from 'react-native-base64';
import RNSimpleCrypto from "react-native-simple-crypto";
import { sha256 } from 'react-native-sha256';
const base64js = require('base64-js');


const oAuthParams = { // neo params for token
  client_id: "905fd317-7397-420f-a7c5-e26aff8dc5b8",
  redirect_uri: "https://oauthasservices-p2000953797trial.hanatrial.ondemand.com",
  authorize_uri: "https://oauthasservices-p2000953797trial.hanatrial.ondemand.com/oauth2/api/v1/authorize",
  token_uri: "https://oauthasservices-p2000953797trial.hanatrial.ondemand.com/oauth2/api/v1/token",
};

const oAuthParamsCF = { // cf params for token
  client_id: "371b34f5-a548-4083-aad0-bbfdb9f9236b",
  redirect_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com",
  authorize_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com/oauth2/api/v1/authorize",
  token_uri: "https://p2000953797trial-dev-com-saplogin.cfapps.eu10.hana.ondemand.com/oauth2/api/v1/token",
};

let requestPending = false;


const MainLogic = () => {
  const [webViewComp, setWebView] = useState(null);
  const [verifier, setVerifier] = useState("");
  const [challenge, setChallange] = useState("");

  useEffect(() => {
    _generateCodeAndVerifier().then(() => {
      let vebViewUri = oAuthParams.authorize_uri + "?response_type=code&client_id="+ oAuthParams.client_id + 
        "&code_challenge=" + challenge + "&code_challenge_method=S256&redirect_uri=" + oAuthParams.redirect_uri;
      console.log(vebViewUri);
      let webViewVar = <WebView onNavigationStateChange={_navigationUriChange} source={{uri: vebViewUri}}/>
      setWebView(webViewVar)
    })
    .catch((err) => {
      alert("Error cannot generate challange and verifier, see logs for more");
    });
  }, []);

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
        RNSimpleCrypto.utils.randomBytes(32)
          .then((keyArrayBuffer) => {
          const verifier = base64URLEncode(keyArrayBuffer);
          setVerifier(verifier);
          sha256(verifier).then(hash => {
            const challenge = base64URLEncode(hash);
            //base64.encode(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
            setChallange(challenge);
            resolve();
          });
        });
      }catch(err){
        console.log(err);
        reject(err);
      }
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
      console.log(params.code);
      let accessTokenUri = oAuthParams.token_uri + "?grant_type=authorization_code&client_id=" + 
        oAuthParams.client_id + "&code_verifier=" + verifier + "&code=" + code + "&redirect_uri=" + 
        oAuthParams.redirect_uri;
      console.log(accessTokenUri);
      fetch(accessTokenUri, { method: 'Post', headers: headers })
      .then(res => res.json())
      .then(response => console.log(response))
      .catch(err => {
        alert(err);
      });
    }
  }

  return (
    <View style={{flex: 1}}>
      {webViewComp}
    </View>
  );
};

export default MainLogic;