// 사용자 역할 정의
export const USER_ROLES = {
    ADMIN: 'admin',
    SERVICE: 'service',
    CLIENT: 'client'
};

// 간단한 해시 함수 (실제로는 bcrypt 사용 권장)
const hashPassword = (password) => {

    // null/undefined 체크 추가
    if (!password || typeof password !== 'string') return '0';

    // 간단한 해시 (실제로는 더 강력한 해시 사용)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
    }
    return hash.toString();
};

// 간단한 JWT 스타일 토큰 생성
const generateToken = (user) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

    // 한국어 처리를 위해 encodeURIComponent 사용
    const payloadString = JSON.stringify({
        username: user.username,
        role: user.role,
        name: user.name,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24시간
    });
    const payload = btoa(encodeURIComponent(payloadString));
    const signature = btoa(`${header}.${payload}.secret`);
    return `${header}.${payload}.${signature}`;
};

// 토큰 검증 함수
const verifyToken = (token) => {
    try {
        if (!token) return null;
        const [, payload] = token.split('.'); // header와 signature는 사용 안 하므로 생략
        const decodedPayload = JSON.parse(decodeURIComponent(atob(payload)));

        // 만료 시간 체크
        if (Date.now() > decodedPayload.exp) {
            return null; // 토큰 만료
        }

        return decodedPayload;
    } catch {
        return null; // 잘못된 토큰 (error 파라미터 제거)
    }
};

// 사용자 계정 정보 (해시된 비밀번호)
export const USERS = {
    'admin': {
        password: hashPassword('admin!'),
        role: USER_ROLES.ADMIN,
        name: '관리자',
        description: '모든 기능 접근 가능'
    },
    'service': {
        password: hashPassword('service!'),
        role: USER_ROLES.SERVICE,
        name: '서비스팀',
        description: '모든 기능 접근 가능'
    },
    'client01': {
        password: hashPassword('client!'),
        role: USER_ROLES.CLIENT,
        name: '고객사',
        description: '주차현황 조회만 가능'
    },
    'client02': {
        password: hashPassword('client!'),
        role: USER_ROLES.CLIENT,
        name: '고객사',
        description: '주차현황 조회만 가능'
    }
};

// 권한별 접근 가능한 컴포넌트
export const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: [
        'parkingMonitor',    // 주차현황
        'manualControl',     // 수동제어
        'sensorMonitor',     // 센서모니터
        'configPanel',       // 설정
        'connectionPanel',   // 연결설정
        'eventMonitor'
    ],
    [USER_ROLES.SERVICE]: [
        'parkingMonitor',    // 주차현황
        'manualControl',     // 수동제어
        'sensorMonitor',     // 센서모니터
        'configPanel',       // 설정
        'connectionPanel',    // 연결설정
        'eventMonitor'
    ],
    [USER_ROLES.CLIENT]: [
        'parkingMonitor',    // 주차현황만
        'eventMonitor'
    ]
};

// 권한별 탭 표시 설정
export const ROLE_TABS = {
    [USER_ROLES.ADMIN]: [
        { id: 'parking', name: '주차 현황', icon: '🚗' },
        { id: 'events', name: '입출차 이벤트', icon: '📋' },
        { id: 'manual', name: '수동 제어', icon: '🎮' },
        { id: 'sensor', name: '센서 모니터', icon: '📊' },
        { id: 'config', name: '설정', icon: '⚙️' }
    ],
    [USER_ROLES.SERVICE]: [
        { id: 'parking', name: '주차 현황', icon: '🚗' },
        { id: 'events', name: '입출차 이벤트', icon: '📋' },
        { id: 'manual', name: '수동 제어', icon: '🎮' },
        { id: 'sensor', name: '센서 모니터', icon: '📊' },
        { id: 'config', name: '설정', icon: '⚙️' }
    ],
    [USER_ROLES.CLIENT]: [
        { id: 'events', name: '입출차 이벤트', icon: '📋' },
        { id: 'parking', name: '주차 현황', icon: '🚗' }
    ]
};

// 로그인 검증 함수
export const validateLogin = (username, password) => {
    if (username == null || password == null) return { success: false, error: '아이디와 비밀번호를 입력해주세요.' };
    const user = USERS[username.trim()];
    if (!user) {
        return { success: false, error: '존재하지 않는 사용자입니다.' };
    }
    // 입력받은 비밀번호를 해시화해서 비교
    if (user.password !== hashPassword(password.trim())) {
        return { success: false, error: '비밀번호가 올바르지 않습니다.' };
    }

    const userInfo = {
        username,
        role: user.role,
        name: user.name,
        description: user.description
    };

    const token = generateToken(userInfo);
    saveToken(token); // 토큰 자동 저장

    return {
        success: true,
        user: userInfo,
        token: token
    };
};

// 권한 체크 함수
export const hasPermission = (userRole, component) => {
    return ROLE_PERMISSIONS[userRole]?.includes(component) || false;
};

// 사용자 정보 가져오기
export const getUserInfo = (username) => {
    const user = USERS[username];
    if (!user) return null;

    return {
        username,
        name: user.name,
        role: user.role,
        description: user.description,
        permissions: ROLE_PERMISSIONS[user.role] || [],
        tabs: ROLE_TABS[user.role] || []
    };
};

// 토큰 저장
export const saveToken = (token) => {
    sessionStorage.setItem('authToken', token);
};

// 토큰 로드
export const loadToken = () => {
    return sessionStorage.getItem('authToken');
};

// 자동 로그인 체크 (페이지 로드 시 사용)
export const checkAutoLogin = () => {
    const token = loadToken();
    if (!token) {
        return { success: false, error: '저장된 토큰이 없습니다.' };
    }

    const userInfo = getCurrentUserFromToken(token);
    if (!userInfo) {
        // 토큰이 만료되거나 유효하지 않은 경우
        sessionStorage.removeItem('authToken');
        return { success: false, error: '토큰이 만료되었습니다.' };
    }

    return {
        success: true,
        user: userInfo,
        token: token
    };
};

// 세션 타임아웃 관리
let sessionTimeoutId = null;

// 세션 타임아웃 시작 (30분)
export const startSessionTimeout = (onTimeout) => {
    clearSessionTimeout(); // 기존 타임아웃 제거
    sessionTimeoutId = setTimeout(() => {
        logout();
        onTimeout(); // 타임아웃 콜백 실행
    }, 24 * 60 * 60 * 1000); // 24시간
};

// 세션 타임아웃 초기화 (사용자 활동 시 호출)
export const resetSessionTimeout = (onTimeout) => {
    if (sessionTimeoutId) {
        startSessionTimeout(onTimeout);
    }
};

// 세션 타임아웃 해제
export const clearSessionTimeout = () => {
    if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
    }
};

// 로그아웃 함수
export const logout = () => {
    sessionStorage.removeItem('authToken');
    clearSessionTimeout(); // 세션 타임아웃도 함께 정리
    console.log('사용자 로그아웃 - 토큰 및 타임아웃 제거됨');
};

// 토큰에서 현재 사용자 정보 가져오기
export const getCurrentUserFromToken = (token) => {
    const payload = verifyToken(token);
    if (!payload) return null;

    return {
        username: payload.username,
        role: payload.role,
        name: payload.name,
        permissions: ROLE_PERMISSIONS[payload.role] || [],
        tabs: ROLE_TABS[payload.role] || []
    };
};

// 토큰 유효성 검증
export const isTokenValid = (token) => {
    return verifyToken(token) !== null;
};

// 현재 사용자의 역할별 인사말
export const getWelcomeMessage = (userRole, userName) => {
    switch (userRole) {
        case USER_ROLES.ADMIN:
            return `관리자 ${userName}님, 환영합니다! 모든 시스템을 제어할 수 있습니다.`;
        case USER_ROLES.SERVICE:
            return `서비스팀 ${userName}님, 환영합니다! 모든 시스템을 제어할 수 있습니다.`;
        case USER_ROLES.CLIENT:
            return `${userName}님, 환영합니다! 주차 현황을 확인하실 수 있습니다.`;
        default:
            return `${userName}님, 환영합니다!`;
    }
};