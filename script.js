let deviceCounter = 0;
let devices = [];
let connections = [];
let selectedDevice = null;
let isConnecting = false;
let connectStart = null;
let contextMenu = null;
let contextMenuPos = { x: 0, y: 0 };

// 장치 포트 옵션
const portOptions = {
    router: ['Gig0/0', 'Gig0/1', 'Serial0/0'],
    switch: ['FastEthernet0/1', 'FastEthernet0/2'],
    pc: ['Ethernet0']
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

    devices.push({ id: deviceCounter, type: type, x: 50, y: 50, ip: '', subnet: '', ports: portOptions[type], cliHistory: [], interfaces: {}, routing: {} });
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
    const y1 = device2Pos.top + device2Pos.height / 2;
    const x2 = device2Pos.left + device2Pos.width / 2;
    const y2 = device2Pos.top + device2Pos.height / 2;

    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.classList.add('connection');
    line.style.stroke = '#3498db'; // Color for the connection line
    line.style.strokeWidth = '2px'; // Line width

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

// 시뮬레이션 시작
function startSimulation() {
    console.log('Starting simulation...');
    devices.forEach(device => {
        console.log(`Device ${device.id} (${device.type}) - IP: ${device.ip}, Subnet: ${device.subnet}`);
    });
    connections.forEach(conn => {
        console.log(`Connection from ${conn.from} to ${conn.to}`);
    });
    if (connections.length > 0) {
        console.log('Simulating packet transmission...');
    }
}

// 장치 속성 모달 열기
function openModal() {
    document.getElementById('propertyModal').style.display = 'block';
    document.getElementById('ip').value = selectedDevice.ip;
    document.getElementById('subnet').value = selectedDevice.subnet;
}

// 장치 속성 모달 닫기
function closeModal() {
    document.getElementById('propertyModal').style.display = 'none';
}

// 장치 속성 저장
function saveProperties() {
    selectedDevice.ip = document.getElementById('ip').value;
    selectedDevice.subnet = document.getElementById('subnet').value;
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
    cliOutput.innerHTML = ''; // Clear previous output
    selectedDevice.cliHistory.forEach(entry => {
        cliOutput.innerHTML += `<div>Router${entry.state} ${entry.command}</div>`;
    });
    cliOutput.scrollTop = cliOutput.scrollHeight; // 자동 스크롤
}

// CLI 명령어 처리 함수 (확장된 버전)
function processCLICommand(command) {
    let output = '';

    // 기본 명령어 처리
    if (command === 'enable'||command === 'en') {
        currentCLIState = cliStates.PRIVILEGED_EXEC;
    } 
    else if (command === 'configure terminal' || command === 'conf t') {
        currentCLIState = cliStates.GLOBAL_CONFIG;
    } 
    else if (command.startsWith('interface') || command.startsWith('int')) {
        currentCLIState = cliStates.INTERFACE_CONFIG;
        const interfaceName = command.split(' ')[1];
        if (!selectedDevice.interfaces[interfaceName]) {
            selectedDevice.interfaces[interfaceName] = { ip: '', subnet: '', status: 'administratively down' };
        }
        output = `Configuring interface ${interfaceName}`;
    } else if (command.startsWith('ip address') || command.startsWith('ip add')) {
        const parts = command.split(' ');
        const ip = parts[2];
        const subnet = parts[3];
        const interfaceName = Object.keys(selectedDevice.interfaces).pop();
        selectedDevice.interfaces[interfaceName].ip = ip;
        selectedDevice.interfaces[interfaceName].subnet = subnet;
        output = `Assigned IP address ${ip} with subnet mask ${subnet} to ${interfaceName}`;
    } 
    else if (command === 'no shutdown' || command === 'no sh') {
        const interfaceName = Object.keys(selectedDevice.interfaces).pop();
        selectedDevice.interfaces[interfaceName].status = 'up';
        output = `${interfaceName} is now up`;

    // RIP 라우팅 처리
    } else if (command.startsWith('router rip')) {
        currentCLIState = cliStates.ROUTER_CONFIG;
        selectedDevice.routing.protocol = 'rip';
        output = 'Entered RIP routing configuration mode';
    } else if (command.startsWith('network')) {
        const network = command.split(' ')[1];
        selectedDevice.routing.networks = selectedDevice.routing.networks || [];
        selectedDevice.routing.networks.push(network);
        output = `Added network ${network} to RIP routing protocol`;

    // OSPF 라우팅 처리
    } else if (command.startsWith('router ospf')) {
        const processId = command.split(' ')[2];
        currentCLIState = cliStates.ROUTER_CONFIG;
        selectedDevice.routing.protocol = 'ospf';
        selectedDevice.routing.processId = processId;
        output = `Entered OSPF routing configuration mode with process ID ${processId}`;
    } else if (command.startsWith('network') && selectedDevice.routing.protocol === 'ospf') {
        const parts = command.split(' ');
        const network = parts[1];
        const wildcard = parts[2];
        const area = parts[4];
        selectedDevice.routing.networks = selectedDevice.routing.networks || [];
        selectedDevice.routing.networks.push({ network, wildcard, area });
        output = `Added network ${network} with wildcard ${wildcard} to OSPF area ${area}`;

    // Static 라우팅 처리
    } else if (command.startsWith('ip route')) {
        const parts = command.split(' ');
        const destination = parts[2];
        const mask = parts[3];
        const nextHop = parts[4];
        selectedDevice.routing.staticRoutes = selectedDevice.routing.staticRoutes || [];
        selectedDevice.routing.staticRoutes.push({ destination, mask, nextHop });
        output = `Added static route to ${destination} via ${nextHop} with mask ${mask}`;

    // Show ip interface brief 처리
    } else if (command === 'show ip interface brief') {
        output = 'Interface\t\tIP Address\t\tStatus\n';
        for (const [iface, config] of Object.entries(selectedDevice.interfaces)) {
            output += `${iface}\t\t${config.ip || 'unassigned'}\t\t${config.status}\n`;
        }

    // 상태 전환 및 종료
    } else if (command === 'exit' || command === 'ex') {
        if (currentCLIState === cliStates.INTERFACE_CONFIG || currentCLIState === cliStates.ROUTER_CONFIG) {
            currentCLIState = cliStates.GLOBAL_CONFIG;
        } else if (currentCLIState === cliStates.GLOBAL_CONFIG) {
            currentCLIState = cliStates.PRIVILEGED_EXEC;
        } else {
            currentCLIState = cliStates.EXEC;
        }
    } else {
        output = '% Invalid input detected at \'^\' marker.';
    }

    selectedDevice.cliHistory.push({ command: output, state: currentCLIState });
    updateCLIOutput();
}
