// 속초 2,3호기 현장 설정
export const sokcho2Config = {
    // 사이트 기본 정보
    siteInfo: {
        name: "속초",
        unitNumber: "2,3호기",
        siteId: "sokcho2",
        location: "속초 주차타워",
        description: "속초 현장 2,3호기 주차타워"
    },

    // 연결 버튼 구성
    connectionConfig: {
        buttons: [
            {
                unit: 2,
                name: "2호기",
                ip: "192.168.0.102",
                port: 2005
            },
            {
                unit: 3,
                name: "3호기",
                ip: "192.168.0.103",
                port: 2005
            }
        ]
    },

    // 수동 제어용 센서 키 매핑
    manualControlSensors: {
        page1: {
            // 입력 센서 (도어/턴테이블)
            doorOpenSW: "P102_OP도어열림SW",
            doorCloseSW: "P103_OP도어닫힘SW",
            doorInnerSensor: "P109_도어내센서",      // 2,3호기는 "도어내센서"
            doorOpenConfirm: "P10A_도어열림확인",
            doorCloseConfirm: "P10B_도어닫힘확인",
            turn0Confirm: "P120_턴0도확인",          // 2,3호기는 C062
            turn180Confirm: "P121_턴180확인",        // 2,3호기는 C062
            turnLeftStop: "P123_턴좌정지",           // 2,3호기는 C062
            turnRightStop: "P124_턴우정지",          // 2,3호기는 C062
            pedestrianDoor2: "P125_보행자문열림2",   // 2,3호기 추가
            // 턴잠김/해제는 2,3호기에 없음

            // 출력 센서 (도어/턴테이블)
            doorOpenMC: "P212_도어열림MC",
            doorCloseMC: "P213_도어닫힘MC",
            turnMC: "P214_턴MC",                     // 2,3호기는 C071
            turnBK: "P215_턴BK",                     // 2,3호기는 C071
            externalTurnForward: "P216_외장턴정",    // 2,3호기 추가
            externalTurnReverse: "P217_외장턴역",    // 2,3호기 추가
            guideLight1: "P208_유도등1",
            guideLight2: "P209_유도등2",
            guideLight4: "P20A_유도등4",
            guideLight8: "P20B_유도등8"
        },

        page2: {
            // 입력 센서 (승강)
            homePosition: "P133_홈위치",
            levelUp: "P148_레벨상",
            levelDown: "P149_레벨하",
            upEmergency: "P118_상승비상",
            upDeceleration: "P11A_상승감속",
            downDeceleration: "P11B_하강감속",
            downEmergency: "P11D_하강비상",
            wireBreak: "P115_와이어절단",

            // 출력 센서 (승강)
            liftInvForward: "P200_L_INV정",
            liftInvReverse: "P201_L_INV역",
            liftMC: "P210_리프트MC",
            liftBK: "P211_리프트BK",
            liftInvRUN: "P112_L_INV_RUN",
            liftInvFLT: "P113_L_INV_FLT",
            liftInvS3: "P202_L_INV_S3",
            liftInvS4: "P203_L_INV_S4",
            liftInvS5: "P204_L_INV_S5",
            liftInvS6: "P205_L_INV_S6"
        },

        page3: {
            // 입력 센서 (횡행/락킹)
            hookCenterFront: "P140_후크중앙(전)",
            hookCenterRear: "P141_후크중앙(후)",
            oddPalletStop: "P142_홀수파렛정지",
            evenPalletStop: "P143_짝수파렛정지",
            oddPalletDetect: "P144_파렛감지(홀)",
            evenPalletDetect: "P145_파렛감지(짝)",
            oddPitSensor: "P116_피트센서(홀)",
            evenPitSensor: "P117_피트센서(짝)",

            // 출력 센서 (횡행/락킹)
            traverseInvForward: "P220_P_INV정",
            traverseInvReverse: "P221_P_INV역",
            traverseMC: "P228_횡행MC",
            traverseBK: "P229_횡행BK",
            traverseInvRUN: "P130_P_INV_RUN",
            traverseInvFLT: "P131_P_INV_FLT",
            traverseInvS3: "P222_P_INV_S3",
            traverseInvS4: "P223_P_INV_S4",
            traverseInvS5: "P224_P_INV_S5",
            traverseInvS6: "P225_P_INV_S6"
        }
    },

    // 기본 시스템 상태 주소 (프론트 호환용 유지)
    systemAddresses: {
        plcComm: 0,         // C000: PLC 통신체크
        remoteOp: 1,        // C001: 원격조작체크  
        pcComm: 3,          // C003: PC통신체크
        siteNumber: 4,      // C004: 현장번호
        unitNumber: 5,      // C005: 주차기번호
        manualMode: 15,     // C015: 수동확인
        errorStatus: 16,    // C016: 에러확인
        emergencyStop: 24,  // C024: 비상스위치
        heartbeat: 0        // C000 기준
    },

    // 차량/상태 정보 주소
    dataAddresses: {
        vehicleNumber: 73,      // C073: 차량번호창에 차량번호
        inOutNumber: 74,        // C074: 입출고차번호
        loadedPallet: 75,       // C075: 적재차판
        unloadPallet: 76,       // C076: 출고차판
        totalParked: 77,        // C077: 전체주차대수
        totalEmpty: 78,         // C078: 전체공차대수
        normalIn: 79,           // C079: 일반입고수
        normalEmpty: 80,        // C080: 일반공차수
        rvEmpty: 81,            // C081: RV공차수
        rvIn: 82,               // C082: RV입고수
        inOutMessage: 83,       // C083: 입출고메시지
        searchMessage: 84,      // C084: 검색화면메시지
        liftPalletStatus: 87,   // C087: 리프트파렛유무
        entranceVehicle: 88,    // C088: 진입층차량유무
        encoderValue: 89        // C089: 엔코더값
    },

    // 리프트 위치정보 (C200~C245)
    liftPositions: {
        counter: 200,           // C200: 카운터
        entrancePos: 201,       // C201: 리프트승입장위치
        floor1: 202,            // C202: 리프트1단위치
        floor2: 203,            // C203: 리프트2단위치  
        floor3: 204,            // C204: 리프트3단위치
        floor4: 205,            // C205: 리프트4단위치
        floor5: 206,            // C206: 리프트5단위치
        floor6: 207,            // C207: 리프트6단위치
        floor7: 208,            // C208: 리프트7단위치
        floor8: 209,            // C209: 리프트8단위치
        floor9: 210,            // C210: 리프트9단위치
        floor10: 211,           // C211: 리프트10단위치
        floor11: 212,           // C212: 리프트11단위치
        floor12: 213,           // C213: 리프트12단위치
        floor13: 214,           // C214: 리프트13단위치
        floor14: 215,           // C215: 리프트14단위치
        floor15: 216,           // C216: 리프트15단위치
        floor16: 217,           // C217: 리프트16단위치
        floor17: 218,           // C218: 리프트17단위치
        floor18: 219,           // C219: 리프트18단위치
        floor19: 220,           // C220: 리프트19단위치
        floor20: 221,           // C221: 리프트20단위치
        floor21: 222,           // C222: 리프트21단위치
        floor22: 223,           // C223: 리프트22단위치
        floor23: 224,           // C224: 리프트23단위치
        floor24: 225,           // C225: 리프트24단위치
        floor25: 226,           // C226: 리프트25단위치
        floor26: 227,           // C227: 리프트26단위치
        floor27: 228,           // C228: 리프트27단위치
        floor28: 229,           // C229: 리프트28단위치
        floor29: 230,           // C230: 리프트29단위치
        floor30: 231,           // C231: 리프트30단위치
        floor31: 232,           // C232: 리프트31단위치
        floor32: 233,           // C233: 리프트32단위치
        floor33: 234,           // C234: 리프트33단위치
        floor34: 235,           // C235: 리프트34단위치
        floor35: 236,           // C236: 리프트35단위치
        floor36: 237,           // C237: 리프트36단위치
        floor37: 238,           // C238: 리프트37단위치
        floor38: 239,           // C239: 리프트38단위치
        floor39: 240            // C240: 리프트39단위치
    },

    // 센서 매핑 정보 (입력 센서)
    sensorMapping: {
        // C060 (P100~P10F) - 도어/OP/안전
        c060: {
            address: 60,
            sensors: {
                0: { name: "P100_OP전진센서", description: "OP 전진 센서", category: "안전센서" },
                1: { name: "P101_OP후진센서", description: "OP 후진 센서", category: "안전센서" },
                2: { name: "P102_OP도어열림SW", description: "OP 도어열림 스위치", category: "도어" },
                3: { name: "P103_OP도어닫힘SW", description: "OP 도어닫힘 스위치", category: "도어" },
                4: { name: "P104_1F전진센서", description: "1층 전진 센서", category: "안전센서" },
                5: { name: "P105_1F후진센서", description: "1층 후진 센서", category: "안전센서" },
                6: { name: "P106_1F도어열림SW", description: "1층 도어열림 스위치", category: "도어" },
                7: { name: "P107_1F도어닫힘SW", description: "1층 도어닫힘 스위치", category: "도어" },
                8: { name: "P108_보행자문열림", description: "보행자문 열림", category: "도어" },
                9: { name: "P109_도어내센서", description: "도어 내부 센서", category: "도어" },
                10: { name: "P10A_도어열림확인", description: "도어 열림 확인", category: "도어" },
                11: { name: "P10B_도어닫힘확인", description: "도어 닫힘 확인", category: "도어" },
                12: { name: "P10C_외부키", description: "외부 키", category: "제어" }
            }
        },

        // C061 (P110~P11F) - 인버터/안전센서
        c061: {
            address: 61,
            sensors: {
                0: { name: "P110_L_INV_ALM", description: "리프트 인버터 알람", category: "리프트" },
                2: { name: "P112_L_INV_RUN", description: "리프트 인버터 RUN", category: "리프트" },
                3: { name: "P113_L_INV_FLT", description: "리프트 인버터 FLT", category: "리프트" },
                4: { name: "P114_L_EOCR", description: "리프트 EOCR", category: "리프트" },
                5: { name: "P115_와이어절단", description: "와이어 절단", category: "안전센서" },
                6: { name: "P116_피트센서(홀)", description: "피트센서 홀수", category: "안전센서" },
                7: { name: "P117_피트센서(짝)", description: "피트센서 짝수", category: "안전센서" },
                8: { name: "P118_상승비상", description: "상승 비상", category: "안전센서" },
                10: { name: "P11A_상승감속", description: "상승 감속", category: "리프트" },
                11: { name: "P11B_하강감속", description: "하강 감속", category: "리프트" },
                13: { name: "P11D_하강비상", description: "하강 비상", category: "안전센서" },
                14: { name: "P11E_좌우미러", description: "좌우 미러", category: "안전센서" }
            }
        },

        // C062 (P120~P12F) - 턴테이블/외장 (2,3호기에서 턴 센서들이 여기로 이동)
        c062: {
            address: 62,
            sensors: {
                0: { name: "P120_턴0도확인", description: "턴 0도 확인", category: "턴테이블" },
                1: { name: "P121_턴180확인", description: "턴 180도 확인", category: "턴테이블" },
                3: { name: "P123_턴좌정지", description: "턴 좌정지", category: "턴테이블" },
                4: { name: "P124_턴우정지", description: "턴 우정지", category: "턴테이블" },
                5: { name: "P125_보행자문열림2", description: "보행자문 열림2", category: "도어" },
                13: { name: "P12D_외장턴정SW", description: "외장턴 정방향 SW", category: "턴테이블" },
                14: { name: "P12E_외장턴역SW", description: "외장턴 역방향 SW", category: "턴테이블" }
            }
        },

        // C063 (P130~P13F) - 인버터/위치/조작 (턴 센서들이 C062로 이동해서 비워짐)
        c063: {
            address: 63,
            sensors: {
                0: { name: "P130_P_INV_RUN", description: "횡행 인버터 RUN", category: "횡행" },
                1: { name: "P131_P_INV_FLT", description: "횡행 인버터 FLT", category: "횡행" },
                2: { name: "P132_P_EOCR", description: "횡행 EOCR", category: "횡행" },
                3: { name: "P133_홈위치", description: "홈 위치", category: "위치센서" },
                9: { name: "P139_상승SW", description: "상승 스위치", category: "리프트" },
                10: { name: "P13A_고속SW", description: "고속 스위치", category: "리프트" },
                11: { name: "P13B_하강SW", description: "하강 스위치", category: "리프트" },
                12: { name: "P13C_비상SW", description: "비상 스위치", category: "안전센서" },
                15: { name: "P13F_턴회전위치", description: "턴 회전위치", category: "턴테이블" }
            }
        },

        // C064 (P140~P14F) - 후크/파렛/레벨 (턴잠김/해제 제거됨)
        c064: {
            address: 64,
            sensors: {
                0: { name: "P140_후크중앙(전)", description: "후크 중앙 전", category: "후크" },
                1: { name: "P141_후크중앙(후)", description: "후크 중앙 후", category: "후크" },
                2: { name: "P142_홀수파렛정지", description: "홀수 파렛 정지", category: "위치센서" },
                3: { name: "P143_짝수파렛정지", description: "짝수 파렛 정지", category: "위치센서" },
                4: { name: "P144_파렛감지(홀)", description: "파렛 감지 홀수", category: "위치센서" },
                5: { name: "P145_파렛감지(짝)", description: "파렛 감지 짝수", category: "위치센서" },
                8: { name: "P148_레벨상", description: "레벨 상", category: "위치센서" },
                9: { name: "P149_레벨하", description: "레벨 하", category: "위치센서" },
                10: { name: "P14A_리프트내RV감지", description: "리프트내 RV 감지", category: "위치센서" },
                11: { name: "P14B_좌미러센서", description: "좌미러 센서", category: "안전센서" },
                12: { name: "P14C_우미러센서", description: "우미러 센서", category: "안전센서" }
            }
        },

        // C070 (P200~P20F) - 출력 상태
        c070: {
            address: 70,
            sensors: {
                0: { name: "P200_L_INV정", description: "리프트 인버터 정회전", category: "출력" },
                1: { name: "P201_L_INV역", description: "리프트 인버터 역회전", category: "출력" },
                2: { name: "P202_L_INV_S3", description: "리프트 인버터 S3", category: "출력" },
                3: { name: "P203_L_INV_S4", description: "리프트 인버터 S4", category: "출력" },
                4: { name: "P204_L_INV_S5", description: "리프트 인버터 S5", category: "출력" },
                5: { name: "P205_L_INV_S6", description: "리프트 인버터 S6", category: "출력" },
                6: { name: "P206_L_INV_S7", description: "리프트 인버터 S7", category: "출력" },
                7: { name: "P207_L_INV_S8", description: "리프트 인버터 S8", category: "출력" },
                8: { name: "P208_유도등1", description: "유도등 1", category: "출력" },
                9: { name: "P209_유도등2", description: "유도등 2", category: "출력" },
                10: { name: "P20A_유도등4", description: "유도등 4", category: "출력" },
                11: { name: "P20B_유도등8", description: "유도등 8", category: "출력" },
                12: { name: "P20C_부저", description: "부저", category: "출력" },
                13: { name: "P20D_입고중", description: "입고중 표시", category: "출력" },
                14: { name: "P20E_대기중", description: "대기중 표시", category: "출력" },
                15: { name: "P20F_출고중", description: "출고중 표시", category: "출력" }
            }
        },

        // C071 (P210~P21F) - MC/BK/도어/턴 출력 (턴 제어가 여기로 이동)
        c071: {
            address: 71,
            sensors: {
                0: { name: "P210_리프트MC", description: "리프트 MC", category: "출력" },
                1: { name: "P211_리프트BK", description: "리프트 BK", category: "출력" },
                2: { name: "P212_도어열림MC", description: "도어열림 MC", category: "출력" },
                3: { name: "P213_도어닫힘MC", description: "도어닫힘 MC", category: "출력" },
                4: { name: "P214_턴MC", description: "턴 MC", category: "출력" },
                5: { name: "P215_턴BK", description: "턴 BK", category: "출력" },
                6: { name: "P216_외장턴정", description: "외장턴 정", category: "출력" },
                7: { name: "P217_외장턴역", description: "외장턴 역", category: "출력" },
                15: { name: "P21F_저항FAN", description: "저항 FAN", category: "출력" }
            }
        },

        // C072 (P220~P22F) - 횡행 출력 (턴 제어 제거됨)
        c072: {
            address: 72,
            sensors: {
                0: { name: "P220_P_INV정", description: "횡행 인버터 정회전", category: "출력" },
                1: { name: "P221_P_INV역", description: "횡행 인버터 역회전", category: "출력" },
                2: { name: "P222_P_INV_S3", description: "횡행 인버터 S3", category: "출력" },
                3: { name: "P223_P_INV_S4", description: "횡행 인버터 S4", category: "출력" },
                4: { name: "P224_P_INV_S5", description: "횡행 인버터 S5", category: "출력" },
                5: { name: "P225_P_INV_S6", description: "횡행 인버터 S6", category: "출력" },
                6: { name: "P226_P_INV_S7", description: "횡행 인버터 S7", category: "출력" },
                8: { name: "P228_횡행MC", description: "횡행 MC", category: "출력" },
                9: { name: "P229_횡행BK", description: "횡행 BK", category: "출력" }
            }
        }
    },

    api: {
        baseUrl: '',
        devPort: 5124,
        endpoints: {
            recent: '/api/parkingevents/recent',
            parked: '/api/parkingevents/parked',
            statistics: '/api/parkingevents/statistics',
            search: '/api/parkingevents/search'
        }
    },

    // CCTV 설정
    cctvConfig: {
        channels: [
            { number: 2, name: 'Channel 2 (D2)' },
            { number: 3, name: 'Channel 3 (D3)' },
            { number: 4, name: 'Channel 4 (D4)' },
            { number: 5, name: 'Channel 5 (D5)' },
            { number: 6, name: 'Channel 6 (D6)' },
            { number: 7, name: 'Channel 7 (D7)' },
            { number: 8, name: 'Channel 8 (D8)' },
            { number: 9, name: 'Channel 9 (D9)' }
        ],
        defaultConnection: {
            ipAddress: 'epscctv02.iptime.org',
            port: 8081,
            rtspPort: 8889,
            username: 'admin',
            password: '!yanry4880'
        }
    },


    // 주차장 모니터링 설정 (2,3호기 전용)
    parkingMonitor: {
        vehicleAddressStart: 101,               // C101
        vehicleAddressEnd: 180,                 // C180
        totalSlots: 80,
        maxFloor: 39,
        hasPlateStatus: false,
        liftPositionStart: 200,                 // C200
        entranceLevel: 201,                     // C201: 승입장
        turnLevel: 202                          // C202: 1단위치
    }
};

export default sokcho2Config;