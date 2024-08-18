// 초기 변수
let deviceCounter = 0;
let devices = [];
let connections = [];
let selectedDevice = null;
let isConnecting = false;
let connectStart = null;
let contextMenu = null;
let contextMenuPos = { x: 0, y: 0 };
let animatingPacket = false;
let packetElement = null;

// 장치 포트 옵션
const portOptions = {
    router: ['Gig0/0', 'Gig0/1', 'Serial0/0'],
    switch: ['FastEthernet0/1', 'FastEthernet0/2'],
    pc: ['Ethernet0'],
    server: ['Ethernet0']
};

// CLI 상태 관리
const cliStates = {
    EXEC: '>',  
    PRIVILEGED_EXEC: '#',  
    GLOBAL_CONFIG: '(config)#', 
    INTERFACE_CONFIG: '(config-if)#', 
    ROUTER_CONFIG: '(config-router)#' 
};

// 현재 CLI 상태
let currentCLIState = cliStates.EXEC;

// 장치 추가 함수
function addDevice(type) {
    const workspace = document.getElementById('workspace');
    const device = document.createElement('div');
    device.className = `device ${type}`;
    device.innerText = type.charAt(0).toUpperCase() + type.slice(1);
    device.style.top = '50px';
    device.style.left = '50px';
    device.setAttribute('draggable', true);
    device.setAttribute('data-id', deviceCounter);
    device.setAttribute('data-type', type);
    
    device.addEventListener('dragstart', dragStart);
    device.addEventListener('dragend', dragEnd);
    device.addEventListener('click', () => selectDevice(device));
    device.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e);
    });

    devices.push({ id: deviceCounter, type: type, x: 50, y: 50, ip: '', subnet: '', gateway: '', ports: portOptions[type], cliHistory: [], interfaces: {}, routing: {} });
    deviceCounter++;
    workspace.appendChild(device);
}

// 드래그 시작
function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
}

// 드래그 종료
function dragEnd(e) {
    const id = e.target.getAttribute('data-id');
    const device = devices.find(d => d.id == id);
    device.x = e.target.offsetLeft;
    device.y = e.target.offsetTop;
    updateConnections();
}

// 드래그 허용
function allowDrop(e) {
    e.preventDefault();
}

// 드래그된 장치가 떨어질 위치 계산
function drop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const device = devices.find(d => d.id == id);
    const elem = document.querySelector(`[data-id='${id}']`);
    elem.style.left = `${e.clientX - 30}px`;
    elem.style.top = `${e.clientY - 30}px`;
    device.x = e.clientX - 30;
    device.y = e.clientY - 30;
    updateConnections();
}

// 장치 선택 및 연결 모드 활성화
function selectDevice(device) {
    if (isConnecting) {
        if (connectStart) {
            createConnection(connectStart, device);
            isConnecting = false;
            connectStart = null;
        } else {
            connectStart = device;
        }
    } else {
        selectedDevice = devices.find(d => d.id == device.getAttribute('data-id'));
        if (selectedDevice.type === 'router') {
            openRouterCommandModal();
        } else {
            openModal();
        }
    }
}

// 연결 모드 활성화
function enableConnectionMode() {
    isConnecting = true;
}

// 장치 간 연결 생성
function createConnection(device1, device2) {
    const connectionLayer = document.getElementById('connectionLayer');
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    const device1Pos = device1.getBoundingClientRect();
    const device2Pos = device2.getBoundingClientRect();

    // 장치 중앙 계산
    const x1 = device1Pos.left + device1Pos.width / 2;
    const y1 = device1Pos.top + device1Pos.height / 2;
    const x2 = device2Pos.left + device2Pos.width / 2;
    const y2 = device2Pos.top + device2Pos.height / 2;

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.classList.add('connection');
    line.style.stroke = '#3498db'; 
    line.style.strokeWidth = '3px'; 

    connectionLayer.appendChild(line);
    connections.push({ from: device1.getAttribute('data-id'), to: device2.getAttribute('data-id'), line: line });
}

// 연결 업데이트
function updateConnections() {
    connections.forEach(conn => {
        const device1 = document.querySelector(`[data-id='${conn.from}']`).getBoundingClientRect();
        const device2 = document.querySelector(`[data-id='${conn.to}']`).getBoundingClientRect();

        const x1 = device1.left + device1.width / 2;
        const y1 = device1.top + device1.height / 2;
        const x2 = device2.left + device2.width / 2;
        const y2 = device2.top + device2.height / 2;

        conn.line.setAttribute('x1', x1);
        conn.line.setAttribute('y1', y1);
        conn.line.setAttribute('x2', x2);
        conn.line.setAttribute('y2', y2);
    });
}

// startSimulation 함수 수정
function startSimulation() {
    console.log('Starting simulation...');
    devices.forEach(device => {
        console.log(`Device ${device.id} (${device.type}) - IP: ${device.ip}, Subnet: ${device.subnet}, Gateway: ${device.gateway}`);
    });

    // 패킷 전송 시뮬레이션
    devices.forEach(device => {
        if (device.type === 'pc') {
            const gateway = devices.find(d => d.ip === device.gateway);
            if (gateway) {
                console.log(`PC ${device.id} sends packet to gateway ${gateway.id}`);
                const route = findPath(device.id, gateway.id);
                console.log(`Path from PC ${device.id} to gateway ${gateway.id}: ${route.join(' -> ')}`);
                animatePacket(route);
            }
        }
    });

    connections.forEach(conn => {
        console.log(`Connection from ${conn.from} to ${conn.to}`);
    });
}

function animatePacket(route) {
    if (animatingPacket) return;
    animatingPacket = true;

    const workspace = document.getElementById('workspace');
    packetElement = document.createElement('div');
    packetElement.className = 'packet';
    workspace.appendChild(packetElement);

    let currentIndex = 0;
    function movePacket() {
        if (currentIndex >= route.length - 1) {
            workspace.removeChild(packetElement);
            animatingPacket = false;
            return;
        }

        const currentDevice = document.querySelector(`[data-id="${route[currentIndex]}"]`);
        const nextDevice = document.querySelector(`[data-id="${route[currentIndex + 1]}"]`);

        const currentRect = currentDevice.getBoundingClientRect();
        const nextRect = nextDevice.getBoundingClientRect();

        const startX = currentRect.left + currentRect.width / 2;
        const startY = currentRect.top + currentRect.height / 2;
        const endX = nextRect.left + nextRect.width / 2;
        const endY = nextRect.top + nextRect.height / 2;

        animatePacketMovement(startX, startY, endX, endY, () => {
            currentIndex++;
            movePacket();
        });
    }

    movePacket();
}

function animatePacketMovement(startX, startY, endX, endY, callback) {
    const duration = 1000; // 1 second
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;

        packetElement.style.left = `${x}px`;
        packetElement.style.top = `${y}px`;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            callback();
        }
    }

    requestAnimationFrame(step);
}


// 경로 찾기
function findPath(startId, endId) {
    const path = [];
    const visited = new Set();
    const queue = [{ id: startId, path: [] }];

    while (queue.length > 0) {
        const { id, path: currentPath } = queue.shift();
        if (id === endId) {
            return [...currentPath, id];
        }

        if (visited.has(id)) continue;
        visited.add(id);

        const connectionsFromCurrent = connections.filter(conn => conn.from === id || conn.to === id);
        connectionsFromCurrent.forEach(conn => {
            const nextId = conn.from === id ? conn.to : conn.from;
            if (!visited.has(nextId)) {
                queue.push({ id: nextId, path: [...currentPath, id] });
            }
        });
    }

    return path;
}

// 장치 추가 함수 (포트 표시 추가)
function addDevice(type) {
    const workspace = document.getElementById('workspace');
    const device = document.createElement('div');
    device.className = `device ${type}`;
    device.innerHTML = `
        ${type.charAt(0).toUpperCase() + type.slice(1)}
        <div class="ports">
            ${portOptions[type].map(port => `<div>${port}</div>`).join('')}
        </div>
    `;
    device.style.top = '50px';
    device.style.left = '50px';
    device.setAttribute('draggable', true);
    device.setAttribute('data-id', deviceCounter);
    device.setAttribute('data-type', type);
    
    device.addEventListener('dragstart', dragStart);
    device.addEventListener('dragend', dragEnd);
    device.addEventListener('click', () => selectDevice(device));
    device.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e);
    });

    devices.push({
        id: deviceCounter,
        type: type,
        x: 50,
        y: 50,
        ip: '',
        subnet: '',
        gateway: '',
        ports: portOptions[type],
        cliHistory: [],
        interfaces: {},
        routing: {}
    });
    deviceCounter++;
    workspace.appendChild(device);
}


// createConnection 장치 연결 함수 
function createConnection(device1, device2) {
    const connectionLayer = document.getElementById('connectionLayer');
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

    const device1Rect = device1.getBoundingClientRect();
    const device2Rect = device2.getBoundingClientRect();

    const x1 = device1Rect.left + device1Rect.width / 2;
    const y1 = device1Rect.top + device1Rect.height / 2;
    const x2 = device2Rect.left + device2Rect.width / 2;
    const y2 = device2Rect.top + device2Rect.height / 2;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const curveX = midX + (y2 - y1) / 4;
    const curveY = midY - (x2 - x1) / 4;

    const d = `M ${x1} ${y1} Q ${curveX} ${curveY} ${x2} ${y2}`;

    line.setAttribute('d', d);
    line.classList.add('connection');
    line.style.stroke = '#3498db';
    line.style.strokeWidth = '2px';
    line.style.fill = 'none';

    connectionLayer.appendChild(line);
    connections.push({ from: device1.getAttribute('data-id'), to: device2.getAttribute('data-id'), line: line });

    updatePortConnection(device1, device2);
}

// 포트 연결 상태 업데이트
function updatePortConnection(device1, device2) {
    const ports1 = device1.querySelector('.ports').children;
    const ports2 = device2.querySelector('.ports').children;
    
    // 포트 표시 업데이트 로직
    const device1Id = device1.getAttribute('data-id');
    const device2Id = device2.getAttribute('data-id');
    
    const connection = connections.find(conn => (conn.from === device1Id && conn.to === device2Id) || (conn.from === device2Id && conn.to === device1Id));

    if (connection) {
        const fromPort = ports1[0]; 
        const toPort = ports2[0];
        
        fromPort.textContent = `${fromPort.textContent} (Connected to ${device2Id})`;
        toPort.textContent = `${toPort.textContent} (Connected to ${device1Id})`;
    }
}

// 장치 속성 모달 열기
function openModal() {
    document.getElementById('propertyModal').style.display = 'block';
    document.getElementById('ip').value = selectedDevice.ip;
    document.getElementById('subnet').value = selectedDevice.subnet;
    document.getElementById('gateway').value = selectedDevice.gateway; // 게이트웨이 입력 추가
}

// 장치 속성 모달 닫기
function closeModal() {
    document.getElementById('propertyModal').style.display = 'none';
}

// 장치 속성 저장
function saveProperties() {
    selectedDevice.ip = document.getElementById('ip').value;
    selectedDevice.subnet = document.getElementById('subnet').value;
    selectedDevice.gateway = document.getElementById('gateway').value; // 게이트웨이 저장
    closeModal();
}

// 라우터 명령어 모달 열기
function openRouterCommandModal() {
    document.getElementById('routerCommandModal').style.display = 'block';
    updateCLIOutput();
}

// 라우터 명령어 모달 닫기
function closeRouterCommandModal() {
    document.getElementById('routerCommandModal').style.display = 'none';
}

// CLI 명령어 처리
function handleCLIInput(event) {
    if (event.key === 'Enter') {
        const input = event.target.value;
        selectedDevice.cliHistory.push({ command: input, state: currentCLIState });
        processCLICommand(input);
        event.target.value = '';
    }
}

// CLI 명령어 출력 업데이트
function updateCLIOutput() {
    const cliOutput = document.getElementById('cliOutput');
    cliOutput.innerHTML = ''; // 이전 출력 지우기
    selectedDevice.cliHistory.forEach(entry => {
        cliOutput.innerHTML += `<div>Router${entry.state} ${entry.command}</div>`;
    });
    cliOutput.scrollTop = cliOutput.scrollHeight; // 자동 스크롤
}

// CLI 명령어 처리 함수 (확장된 버전)
function processCLICommand(command) {
    let output = '';

    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
        case 'enable':
        case 'en':
            currentCLIState = cliStates.PRIVILEGED_EXEC;
            break;

        case 'configure':
        case 'conf':
            if (args[0] === 'terminal' || args[0] === 't') {
                currentCLIState = cliStates.GLOBAL_CONFIG;
            }
            break;

        case 'interface':
        case 'int':
            currentCLIState = cliStates.INTERFACE_CONFIG;
            const interfaceName = args[0];
            if (!selectedDevice.interfaces[interfaceName]) {
                selectedDevice.interfaces[interfaceName] = { ip: '', subnet: '', status: 'administratively down' };
            }
            output = `Configuring interface ${interfaceName}`;
            break;

        case 'ip':
            if (args[0] === 'address' || args[0] === 'add') {
                const [ip, subnet] = args.slice(1);
                const interfaceName = Object.keys(selectedDevice.interfaces).pop();
                selectedDevice.interfaces[interfaceName].ip = ip;
                selectedDevice.interfaces[interfaceName].subnet = subnet;
                output = `Assigned IP address ${ip} with subnet mask ${subnet} to ${interfaceName}`;
            } else if (args[0] === 'route') {
                const [destination, mask, nextHop] = args.slice(1);
                selectedDevice.routing.staticRoutes = selectedDevice.routing.staticRoutes || [];
                selectedDevice.routing.staticRoutes.push({ destination, mask, nextHop });
                output = `Added static route to ${destination} via ${nextHop} with mask ${mask}`;
            }
            break;

        case 'no':
            if (args[0] === 'shutdown' || args[0] === 'sh') {
                const interfaceName = Object.keys(selectedDevice.interfaces).pop();
                selectedDevice.interfaces[interfaceName].status = 'up';
                output = `${interfaceName} is now up`;
            }
            break;

        case 'router':
            if (args[0] === 'rip') {
                currentCLIState = cliStates.ROUTER_CONFIG;
                selectedDevice.routing.protocol = 'rip';
                output = 'Entered RIP routing configuration mode';
            } else if (args[0] === 'ospf') {
                const processId = args[1];
                currentCLIState = cliStates.ROUTER_CONFIG;
                selectedDevice.routing.protocol = 'ospf';
                selectedDevice.routing.processId = processId;
                output = `Entered OSPF routing configuration mode with process ID ${processId}`;
            }
            break;

        case 'network':
            if (selectedDevice.routing.protocol === 'rip') {
                selectedDevice.routing.networks = selectedDevice.routing.networks || [];
                selectedDevice.routing.networks.push(args[0]);
                output = `Added network ${args[0]} to RIP routing protocol`;
            } else if (selectedDevice.routing.protocol === 'ospf') {
                const [network, wildcard, area] = args;
                selectedDevice.routing.networks = selectedDevice.routing.networks || [];
                selectedDevice.routing.networks.push({ network, wildcard, area });
                output = `Added network ${network} with wildcard ${wildcard} to OSPF area ${area}`;
            }
            break;

        case 'show':
            if (args[0] === 'ip' && args[1] === 'interface' && args[2] === 'brief') {
                output = 'Interface\t\tIP Address\t\tStatus\n';
                for (const [iface, config] of Object.entries(selectedDevice.interfaces)) {
                    output += `${iface}\t\t${config.ip || 'unassigned'}\t\t${config.status}\n`;
                }
            }
            break;

        case 'exit':
        case 'ex':
            if (currentCLIState === cliStates.INTERFACE_CONFIG || currentCLIState === cliStates.ROUTER_CONFIG) {
                currentCLIState = cliStates.GLOBAL_CONFIG;
            } else if (currentCLIState === cliStates.GLOBAL_CONFIG) {
                currentCLIState = cliStates.PRIVILEGED_EXEC;
            } else {
                currentCLIState = cliStates.EXEC;
            }
            break;

        default:
            output = '% Invalid input detected at \'^\' marker.';
            break;
    }

    selectedDevice.cliHistory.push({ command: output, state: currentCLIState });
    updateCLIOutput();
}

// 콘텍스트 메뉴 표시
function showContextMenu(e) {
    contextMenuPos = { x: e.clientX, y: e.clientY };
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
}

// 콘텍스트 메뉴 숨기기
function hideContextMenu() {
    contextMenu.style.display = 'none';
}

// 장치 삭제
function deleteDevice() {
    if (selectedDevice) {
        const deviceElement = document.querySelector(`[data-id="${selectedDevice.id}"]`);
        if (deviceElement) {
            deviceElement.remove();
        }

        // 이 장치와 관련된 연결 제거
        connections = connections.filter(conn => {
            if (conn.from === selectedDevice.id || conn.to === selectedDevice.id) {
                conn.line.remove();
                return false;
            }
            return true;
        });

        devices = devices.filter(d => d.id !== selectedDevice.id);
        selectedDevice = null;
        closeContextMenu();
    }
}

// 콘텍스트 메뉴 닫기
function closeContextMenu() {
    contextMenu.style.display = 'none';
    document.addEventListener('DOMContentLoaded', () => {

    const deleteOption = document.getElementById('deleteDevice');
    deleteOption.addEventListener('click', deleteDevice);
    });
}

// 이벤트 핸들러 등록
document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.getElementById('workspace');
    workspace.addEventListener('dragover', allowDrop);
    workspace.addEventListener('drop', drop);

    const propertyModal = document.getElementById('propertyModal');
    const saveButton = document.getElementById('saveProperties');
    saveButton.addEventListener('click', saveProperties);
    const closeButton = document.getElementById('closeProperties');
    closeButton.addEventListener('click', closeModal);

    const routerCommandModal = document.getElementById('routerCommandModal');
    const cliInput = document.getElementById('cliInput');
    cliInput.addEventListener('keydown', handleCLIInput);
    const closeCommandButton = document.getElementById('closeRouterCommand');
    closeCommandButton.addEventListener('click', closeRouterCommandModal);

    contextMenu = document.getElementById('contextMenu');
    document.addEventListener('click', hideContextMenu);

    document.getElementById('startSimulation').addEventListener('click', startSimulation);
    document.getElementById('enableConnection').addEventListener('click', enableConnectionMode);
});
