let switchBgrd = document.getElementById("switchBgrd");
let switchMacro = document.getElementById("switchMacro");
let runMacro = document.getElementById("runMacro");
let checkMacro = document.getElementById("checkMacro");

chrome.storage.sync.get("macro", ({ macro }) => {
  document.getElementById('switchMacro').checked = macro;
});

// When the button is clicked, inject setPageBackgroundColor into current page
switchBgrd.addEventListener("input", async (e) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: e.target.checked ? setPageBackgroundColor : resetPageBackgroundColor
  });
});

// Turn on the macro saving
switchMacro.addEventListener("input", async (e) => {
  chrome.storage.sync.set({ "macro": e.target.checked });
  console.log("Macro switch set to", e.target.checked);
});

runMacro.addEventListener("click", async () => {
  console.log("runMacro click event occur!");

  chrome.storage.sync.get("requestURLs", async ({ requestURLs }) => {
    chrome.storage.sync.get("requestHeaders", async ({ requestHeaders }) => {
      chrome.storage.sync.get("requestBodys", async ({ requestBodys }) => {
        for (var i = 0; i < requestURLs.length; i++) {
          var headers = new Headers();

          for (var j = 0; j < requestHeaders[i].length; j++) {
            if (requestHeaders[i][j]["name"] != "Cookie") {
              headers.append(requestHeaders[i][j]["name"], requestHeaders[i][j]["value"]);
            }
          }
          
          var url = requestURLs[i];
          
          chrome.storage.sync.get("cookies", async ({ cookies }) => {
            let values = Object.values(cookies);

            let cookieStr = "";

            for (var k = 0; k < values.length; k++) {
              cookieStr += values[k];
              if (k == values.length - 1) break;
              cookieStr += "; ";
            }

            headers.append("Cookie", cookieStr);
          });


          // TODO: 저장된 requestBody의 format을 보고 body에 데이터를 넣을지 params로 할지
          //       body에 넣는 경우 fetch API로 params의 경우 XMLHttpRequest 객체로 해야 한다.
          //       현재 코드는 제대로 동작하지 않는 코드.
          if (requestBodys[i].hasOwnProperty("raw")) {
            var stringBuffer = requestBodys[i].raw[0].bytes;
            var buf = new ArrayBuffer(stringBuffer.length);
            var bufView = new Uint8Array(buf);
            for (var w = 0, strLen=stringBuffer.length; w < strLen; w++) {
              bufView[w] = stringBuffer.charCodeAt(w);
            }

            console.log(buf);
            console.log(bufView);
            
            requestBodys[i].raw[0].bytes = buf;
          }

          let response = await fetch(url, { method: 'POST', headers: headers, body: requestBodys[i] });
          let text = await response.text();
        } 
      });
    });
  });
});

checkMacro.addEventListener("click", () => {
  chrome.storage.sync.get("requestURLs", async ({ requestURLs }) => {
    console.log(requestURLs);
  });
  chrome.storage.sync.get("requestHeaders", async ({ requestHeaders }) => {
    console.log(requestHeaders);
  });
  chrome.storage.sync.get("requestBodys", async ({ requestBodys }) => {
    console.log(requestBodys);
  });
  chrome.storage.sync.get("cookies", async ({ cookies }) => {
    console.log(cookies);
  });
});


// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

function resetPageBackgroundColor() {
  document.body.style.backgroundColor = '#ffffff';
}