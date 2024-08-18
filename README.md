# 🖥️ network simulator - teamlog summer vacation project
백엔드는 기본적인 구조만 구축되어있음 😢

## HTML

## CSS
- 디자인
  - Router : 빨강 Switch : 노랑 PC : 파랑

## JS
👀 코드 주석 참고
### Router 
- CLI
  - 각 라우터 CLI 구현 잘 됨
  
- Port
  - Gig0/0, Gig0/1, Serial0/0 
 
- Add device
  - 라우터 여러개 추가 잘 됨
  - 새로운 라우터 추가시 번호 부여 기능 추가예정•••

### Switch
- Port
  - FastEthernet0/1, FastEthernet0/2 
- Add IP
  - IP, 서브넷 마스크 부여 잘 됨
    
- Switch CLI 추가 예정•••

### PC
- Port
  - Ethernet0
  
- Add IP
  - IP, 서브넷 마스크, 게이트웨이 추가 잘 됨

### Server
- Add IP
  - PC, Switch와 동일 


## 기능 수정 예정 목록 •••
- 모든 장치 삭제 가능하도록 수정 예정
- 케이블 연결 시 포트 선택할 수 있도록 수정 예정
- connect device 연결 후 케이블 엇갈림 수정 예정
- 장치 이동 부드럽게 수정 예정
- 사용 방법 추가 예정
