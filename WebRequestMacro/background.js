let color = '#808080';


chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ "color": color });
  chrome.storage.sync.set({ "macro": false });
  chrome.storage.sync.set({ "requestURLs": [] });
  chrome.storage.sync.set({ "requestHeaders": [] });
  chrome.storage.sync.set({ "requestBodys": [] });
  chrome.storage.sync.set({ "cookies": {} });
  console.log('Default background color set to %cgrey', `color: ${color}`);
});


let onBeforeRequestListener = function (details) {
  console.log(details);

  chrome.storage.sync.get("macro", ({ macro }) => {
    if (macro && isTargetRequest(details)) {
      chrome.storage.sync.get("requestURLs", ({ requestURLs }) => {
        let newLength = requestURLs.push(details.url);
        chrome.storage.sync.set({ "requestURLs": requestURLs });
      });

      chrome.storage.sync.get("requestBodys", ({ requestBodys }) => {        
        let body = {};
        
        if (details.requestBody.raw) {
          console.log(details.requestBody.raw);
          let stringBuffer = String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes));
          
          details.requestBody.raw[0].bytes = stringBuffer;
          // let formData = new FormData();

          // console.log(strings);
          // for (var i = 1; i < strings.length; i++) {
          //   let keyEndIndex = strings[i].indexOf("=");
          //   let key = strings[i].slice(0, keyEndIndex);
          //   let value = strings[i].slice(keyEndIndex + 1, );
          //   formData.append(key, value);
          // }

          // for (var key of formData.entries()) {
          //   console.log(key[0] + ', ' + key[1])
          // }

          // body["formData"] = formData;

          // let newLength = requestBodys.push(body);
          // chrome.storage.sync.set({ "requestBodys": requestBodys });
        }
        
        let newLength = requestBodys.push(details.requestBody);
        chrome.storage.sync.set({ "requestBodys": requestBodys });
  
      });

      // console.log(details);
    }
  });

  return { cancel: false };
};

let onSendHeadersListener = function (details) {
  console.log(details);

  chrome.storage.sync.get("macro", ({ macro }) => {
    if (macro && isTargetRequest(details)) {
      chrome.storage.sync.get("requestHeaders", ({ requestHeaders }) => {
        let newLength = requestHeaders.push(details.requestHeaders);
        chrome.storage.sync.set({ "requestHeaders": requestHeaders });
      });

      console.log(details);
    }
  });

  return { cancel: false };
};

let onResponseStartedListener = function (details) {
  console.log(details);

  // TODO: Set-Cookie 내 key-value 값 추가 혹은 업데이트
  chrome.storage.sync.get("macro", ({ macro }) => {
    if (macro && isTargetRequest(details)) {
      for (var i = 0; i < details.responseHeaders.length; i++) {
        if (details.responseHeaders[i].name == "Set-Cookie") {
          let KeyAndValue = details.responseHeaders[i].value;
          let keyEndIndex = KeyAndValue.indexOf("=");
          let valueEndIndex = KeyAndValue.indexOf(";");
          let key = KeyAndValue.slice(0, keyEndIndex);
          let value = KeyAndValue.slice(0, valueEndIndex);

          chrome.storage.sync.get("cookies", ({ cookies }) => {
            cookies[key] = value;
            chrome.storage.sync.set({ "cookies": cookies });
          });
        }
      }

      console.log(details);
    }
  });

  return { cancel: false };
}

// TODO: 저장될 Request 필터링
// (Type, Initiator) - (document, Other) or (xhr, ) or (xhr, jquery-1.8.3.js:8434)
// DevTools 내에 type 및 initiator와 다르다.
let isTargetRequest = function (details) {
  if (details.type == "xmlhttprequest") return true;

  return false;
}

// format: event.addListener(callback, filter, opt_extraInfoSpec);
// If opt_extraInfoSpec array contains 'blocking', the callback function is handled synchronously
chrome.webRequest.onBeforeRequest.addListener(
  onBeforeRequestListener,
  { urls: ["<all_urls>"] },
  ["requestBody"] // options: blocking(deplicated in MV3), requestBody
)

chrome.webRequest.onSendHeaders.addListener(
  onSendHeadersListener,
  { urls: ["<all_urls>"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.webRequest.onResponseStarted.addListener(
  onResponseStartedListener,
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"] // options: responseHeaders
)