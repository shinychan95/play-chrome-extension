# 주요 이슈

## webRequest에서 blocking 기능 사용 관련 

[Migrating to Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#host-permissions) 문서를 살펴보면,

- `webRequest`는 `declarativeNetRequest`로 대체되었다.
- MV3에서 아직 `webRequest`를 지원한다. 하지만 기능을 제한한다.
- 제한된 기능 중에 onBeforeRequest 내 blocking option이 있다.
- MV3를 기준으로 작업하던 중이어서 우선 blocking을 제거하고 프로젝트를 진행한다.

&nbsp;

## 연속적인 HTTP request 날리는 과정에서 쿠키 파싱

- Fetch API의 경우 응답 헤더에 제한되는 상황이 많이 발생한다.
- 네이버 네트워크 송수신 흐름에 있어서 JSESSIONID, APPLICATION_KEY 등을 지속적으로 업데이트 해야 한다.
- 결론적으로, popup switch를 통해 기록해두었던 request를 보낼 때, 코드 상 response를 사용하는 것이 아닌, 브라우저가 response를 처리하면서 header 내 Set-Cookie를 이용하자.  

&nbsp;

## 개인 정보로 인증 후 결과 확인 불가
![image](https://user-images.githubusercontent.com/39409255/126444105-527a49ab-90cb-481f-854f-03dabbb25693.png)

- result를 받기 위해 보내는 요청의 body가 raw를 key로 Array(1) value에 내부에는 {bytes: ArrayBuffer(91)} 형태로 되어 있다.
- 매크로 저장을 위해서 이 요청 body를 저장하려고 했는데, serialize가 되지 않아 string 변환 후 저장을 해야 했다.
- 하지만 매크로 실행하는 과정에서 string을 다시 ArrayBuffer로 만들면, 원 값과 달라져 결국 실패.

**근데 오늘 다시 확인해보니, ArrayBuffer가 아닌 String으로 잘 들어있는 것이 아닌가...**

&nbsp;

# 전체적인 기능 플로우

## 해결하고 싶은 문제의 네트워크 플로우
1. 메인 페이지 로드
   - GET
   - https://recruit.navercorp.com/naver/recruitMain
   - Header 13개
   - response 내 Set-Cookie (JSESSIONID)
2. 내 지원서 페이지 로드
   - GET
   - https://recruit.navercorp.com/naver/login/myApplicationLogin
   - Header 15개 (Cookie: JSESSIONID)
   - response 내 Set-Cookie (JSESSIONID)
3. 조회하기 버튼 클릭
   - POST
   - type: "xmlhttprequest"
   - https://recruit.navercorp.com/naver/login/myApplicationLoginCheck
   - Form Data (개인 정보)
   - Header 17개 (Cookie: JSESSIONID)
   - response 내 Set-Cookie (APPLICATION_KEY)
   - 
   - POST
   - https://recruit.navercorp.com/naver/login/myApplication
   - Form Data
   - Header 19개 (Cookie: JSESSIONID, APPLICATION_KEY)
4. 확인하고자 하는 지원서 클릭 후 결과 확인
   - POST
   - https://recruit.navercorp.com/naver/result/resultInfo
   - Form Data (고정 데이터 - applId, annoId, classId, jobId)
   - Header 17개 (Cookie: JSESSIONID, APPLICATION_KEY)
   - response 내 result가 ERR_NODATA이면 아직 결과 나오지 않은 것.


## 매크로 동작 과정

1. 네이버 채용 결과 자동 확인
2. 사용자가 원하는 시작 지점부터 종료 지점까지 네트워크 송수신 매크로 생성 마지막 네트워크 결과 반환


&applId=afgpE3s2joM8nvR0taANjlprTIT8r6bj-VLcEq2aRGc=
&annoId=20005623
&classId=170
&jobId=7056

applId: afgpE3s2joM8nvR0taANjlprTIT8r6bj-VLcEq2aRGc=
annoId: 20005623
classId: 170
jobId: 7056
