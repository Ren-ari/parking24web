// 갑을명가 현장 설정
export const gapEulMyeongGaConfig = {
    // 사이트 기본 정보
    siteInfo: {
        name: "갑을명가",
        unitNumber: "1호기",
        location: "갑을명가",
        description: "갑을명가 현장 1호기 주차타워"
    },

    // 연결 버튼 구성
    connectionConfig: {
        buttons: [
            {
                unit: 1,
                name: "1호기",
                ip: "192.168.1.2",
                port: 2005
            },
        ]
    },

    // 수동 제어용 센서 키 매핑
    manualControlSensors: {
        page1: {
            // 입력 센서 (리프트)
            levelUp: "P101.E_레벨상",
            levelDown: "P101.F_레벨하",
            homeDetect: "P101.2_홈감지",
            floor1Confirm: "P101.3_1단확인",
            floor2Confirm: "P101.4_2단확인",
            floor3Confirm: "P101.5_3단확인",
            floor4Confirm: "P101.6_4단확인",
            floor5Confirm: "P101.7_5단확인",
            floor6Confirm: "P101.8_6단확인",

            // 출력 센서 (리프트)
            doorOpenMC: "P100.E_도어열림",
            doorCloseMC: "P100.F_도어닫힘",
        },

        page2: {
            // 입력 센서 (카트 1단)
            // 홈/리프트 확인
            homeConfirm: "P120.E_홈확인",
            liftConfirm: "P120.F_리프트확인",
            
            // 카트 말굽 센서
            cartHorse1LiftSide: "P120.0_카트말굽1_리프트측",
            cartHorse2LiftSide: "P120.1_카트말굽2_리프트측",
            cartHorse1RoomSide: "P120.2_카트말굽1_룸측",
            cartHorse2RoomSide: "P120.3_카트말굽2_룸측",
            
            // 전면/후면 말굽 슬라이더
            frontHorse1Slider: "P120.4_전면말굽1_슬라이더",
            frontHorse2Slider: "P120.5_전면말굽2_슬라이더",
            rearHorse1Slider: "P120.6_후면말굽1_슬라이더",
            rearHorse2Slider: "P120.7_후면말굽2_슬라이더",
            
            // 차량 돌출 감지
            liftSideVehicleOut: "P120.8_리프트측_차량돌출",
            roomSideVehicleOut: "P120.9_룸측_차량_돌출",
            cartVehicleDetect: "P120.A_카트_차량감지",
            
            // 감속/비상 센서
            startDecelEndEmerg: "P120.D_시작감속_끝번비상",
            endDecelStartEmerg: "P120.C_끝번감속_시작비상",
            
            // 전면 슬라이더
            frontSliderOut: "P121.0_전면_슬라이더_돌출",
            rearSliderOut: "P121.1_후면_슬라이더_돌출",
            frontSliderLoaderPos: "P121.2_전면_슬라이더_로더정위치",
            frontSliderUnloaderPos: "P121.3_전면_슬라이더_언로더정위치",
            frontSliderLoaderEmergency: "P121.4_로더비상_전면_슬라이더",
            frontSliderUnloaderEmergency: "P121.5_언로더비상_전면_슬라이더",
            
            // 후면 슬라이더
            rearSliderLoaderPos: "P121.6_후면_슬라이더_로더정위치",
            rearSliderUnloaderPos: "P121.7_후면_슬라이더_언로더정위치",
            rearSliderLoaderEmergency: "P121.8_로더비상_후면_슬라이더",
            rearSliderUnloaderEmergency: "P121.9_언로더비상_후면_슬라이더",
            rearSliderWheelDetect: "P121.B_후면_슬라이더_바퀴감지",
            
            // 차량 감지 (리프트/룸측)
            liftSideVehicleDetect: "P121.C_리프트측_차량감지",
            roomSideVehicleDetect: "P121.D_룸측_차량감지",
        },

        page3: {
            // 입력 센서 (카트 2단)
            // 홈/리프트 확인
            homeConfirm: "P130.E_홈확인",
            liftConfirm: "P130.F_리프트확인",
            
            // 카트 말굽 센서
            cartHorse1LiftSide: "P130.0_카트말굽1_리프트측",
            cartHorse2LiftSide: "P130.1_카트말굽2_리프트측",
            cartHorse1RoomSide: "P130.2_카트말굽1_룸측",
            cartHorse2RoomSide: "P130.3_카트말굽2_룸측",
            
            // 전면/후면 말굽 슬라이더
            frontHorse1Slider: "P130.4_전면말굽1_슬라이더",
            frontHorse2Slider: "P130.5_전면말굽2_슬라이더",
            rearHorse1Slider: "P130.6_후면말굽1_슬라이더",
            rearHorse2Slider: "P130.7_후면말굽2_슬라이더",
            
            // 차량 돌출 감지
            liftSideVehicleOut: "P130.8_리프트측_차량돌출",
            roomSideVehicleOut: "P130.9_룸측_차량_돌출",
            cartVehicleDetect: "P130.A_카트_차량감지",
            
            // 감속/비상 센서
            startDecelEndEmerg: "P130.D_시작감속_끝번비상",
            endDecelStartEmerg: "P130.C_끝번감속_시작비상",
            
            // 전면 슬라이더
            frontSliderOut: "P131.0_전면_슬라이더_돌출",
            rearSliderOut: "P131.1_후면_슬라이더_돌출",
            frontSliderLoaderPos: "P131.2_전면_슬라이더_로더정위치",
            frontSliderUnloaderPos: "P131.3_전면_슬라이더_언로더정위치",
            frontSliderLoaderEmergency: "P131.4_로더비상_전면_슬라이더",
            frontSliderUnloaderEmergency: "P131.5_언로더비상_전면_슬라이더",
            
            // 후면 슬라이더
            rearSliderLoaderPos: "P131.6_후면_슬라이더_로더정위치",
            rearSliderUnloaderPos: "P131.7_후면_슬라이더_언로더정위치",
            rearSliderLoaderEmergency: "P131.8_로더비상_후면_슬라이더",
            rearSliderUnloaderEmergency: "P131.9_언로더비상_후면_슬라이더",
            rearSliderWheelDetect: "P131.B_후면_슬라이더_바퀴감지",
            
            // 차량 감지 (리프트/룸측)
            liftSideVehicleDetect: "P131.C_리프트측_차량감지",
            roomSideVehicleDetect: "P131.D_룸측_차량감지",
        },

        page5: {
            // 입력 센서 (카트 4단)
            // 홈/리프트 확인
            homeConfirm: "P140.E_홈확인",
            liftConfirm: "P140.F_리프트확인",
            
            // 카트 말굽 센서
            cartHorse1LiftSide: "P140.0_카트말굽1_리프트측",
            cartHorse2LiftSide: "P140.1_카트말굽2_리프트측",
            cartHorse1RoomSide: "P140.2_카트말굽1_룸측",
            cartHorse2RoomSide: "P140.3_카트말굽2_룸측",
            
            // 전면/후면 말굽 슬라이더
            frontHorse1Slider: "P140.4_전면말굽1_슬라이더",
            frontHorse2Slider: "P140.5_전면말굽2_슬라이더",
            rearHorse1Slider: "P140.6_후면말굽1_슬라이더",
            rearHorse2Slider: "P140.7_후면말굽2_슬라이더",
            
            // 차량 돌출 감지
            liftSideVehicleOut: "P140.8_리프트측_차량돌출",
            roomSideVehicleOut: "P140.9_룸측_차량_돌출",
            cartVehicleDetect: "P140.A_카트_차량감지",
            
            // 감속/비상 센서
            startDecelEndEmerg: "P140.D_시작감속_끝번비상",
            endDecelStartEmerg: "P140.C_끝번감속_시작비상",
            
            // 전면 슬라이더
            frontSliderOut: "P141.0_전면_슬라이더_돌출",
            rearSliderOut: "P141.1_후면_슬라이더_돌출",
            frontSliderLoaderPos: "P141.2_전면_슬라이더_로더정위치",
            frontSliderUnloaderPos: "P141.3_전면_슬라이더_언로더정위치",
            frontSliderLoaderEmergency: "P141.4_로더비상_전면_슬라이더",
            frontSliderUnloaderEmergency: "P141.5_언로더비상_전면_슬라이더",
            
            // 후면 슬라이더
            rearSliderLoaderPos: "P141.6_후면_슬라이더_로더정위치",
            rearSliderUnloaderPos: "P141.7_후면_슬라이더_언로더정위치",
            rearSliderLoaderEmergency: "P141.8_로더비상_후면_슬라이더",
            rearSliderUnloaderEmergency: "P141.9_언로더비상_후면_슬라이더",
            rearSliderWheelDetect: "P141.B_후면_슬라이더_바퀴감지",
            
            // 차량 감지 (리프트/룸측)
            liftSideVehicleDetect: "P141.C_리프트측_차량감지",
            roomSideVehicleDetect: "P141.D_룸측_차량감지",
        },

        page6: {
            // 입력 센서 (카트 5단)
            // 홈/리프트 확인
            homeConfirm: "P150.E_홈확인",
            liftConfirm: "P150.F_리프트확인",
            
            // 카트 말굽 센서
            cartHorse1LiftSide: "P150.0_카트말굽1_리프트측",
            cartHorse2LiftSide: "P150.1_카트말굽2_리프트측",
            cartHorse1RoomSide: "P150.2_카트말굽1_룸측",
            cartHorse2RoomSide: "P150.3_카트말굽2_룸측",
            
            // 전면/후면 말굽 슬라이더
            frontHorse1Slider: "P150.4_전면말굽1_슬라이더",
            frontHorse2Slider: "P150.5_전면말굽2_슬라이더",
            rearHorse1Slider: "P150.6_후면말굽1_슬라이더",
            rearHorse2Slider: "P150.7_후면말굽2_슬라이더",
            
            // 차량 돌출 감지
            liftSideVehicleOut: "P150.8_리프트측_차량돌출",
            roomSideVehicleOut: "P150.9_룸측_차량_돌출",
            cartVehicleDetect: "P150.A_카트_차량감지",
            
            // 감속昏비상 센서
            startDecelEndEmerg: "P150.D_시작감속_끝번비상",
            endDecelStartEmerg: "P150.C_끝번감속_시작비상",
            
            // 전면 슬라이더
            frontSliderOut: "P151.0_전면_슬라이더_돌출",
            rearSliderOut: "P151.1_후면_슬라이더_돌출",
            frontSliderLoaderPos: "P151.2_전면_슬라이더_로더정위치",
            frontSliderUnloaderPos: "P151.3_전면_슬라이더_언로더정위치",
            frontSliderLoaderEmergency: "P151.4_로더비상_전면_슬라이더",
            frontSliderUnloaderEmergency: "P151.5_언로더비상_전면_슬라이더",
            
            // 후면 슬라이더
            rearSliderLoaderPos: "P151.6_후면_슬라이더_로더정위치",
            rearSliderUnloaderPos: "P151.7_후면_슬라이더_언로더정위치",
            rearSliderLoaderEmergency: "P151.8_로더비상_후면_슬라이더",
            rearSliderUnloaderEmergency: "P151.9_언로더비상_후면_슬라이더",
            rearSliderWheelDetect: "P151.B_후면_슬라이더_바퀴감지",
            
            // 차량 감 Symptoms(리프트/룸측)
            liftSideVehicleDetect: "P151.C_리프트측_차량감지",
            roomSideVehicleDetect: "P151.D_룸측_차량감지",
        }
    },

    // PLC 기본 설정
    plcConfig: {
        ip: "192.168.1.2", 
        port: 2005,
        deviceType: "P",
        startAddress: 0
    },

      // 기본 시스템 상태 주소
      systemAddresses: {
        plcComm: 112,         // P112: PLC 통신체크
        remoteOp: { address: 119, bit: 0 }, // P119.0: 전체원격제어 
        remoteOpLift: { address: 119, bit: 1 }, // P119.1: 리프트 수동조작
        remoteOpCart1: { address: 119, bit: 2 }, // P119.2: 카트1 수동조작
        remoteOpCart2: { address: 119, bit: 3 }, // P119.3: 카트2 수동조작
        remoteOpCart3: { address: 119, bit: 4 }, // P119.4: 카트3 수동조작
        remoteOpCart4: { address: 119, bit: 5 }, // P119.5: 카트4 수동조작
        remoteOpCart5: { address: 119, bit: 6 }, // P119.6: 카트5 수동조작
        remoteOpCart6: { address: 119, bit: 7 }, // P119.7: 카트6 수동조작
        pcComm: 3,          // C003: PC통신체크
        siteNumber: 114,      // P114: 현장번호
        unitNumber: 115,      // P115: 주차기번호
        manualMode: 15,     // C015: 수동확인
        errorStatus: 16,    // C016: 에러확인
        emergencyStop: 24,  // C024: 비상스위치
        heartbeat: 110        // P110: 하트비트
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
        encoderValue: 89,       // C089: 엔코더값
        k16Error: 92,           // C092: K16에러
        k17Error: 93,           // C093: K17에러
        k18Error: 94,           // C094: K18에러
        k19Error: 95            // C095: K19에러
    },

        // 페이지별 데이터 주소
        pageDataAddresses: {
            // 페이지 2: 1단카트
            page2: {
                // 1단카트 상태 데이터 (P129)
                remoteManualMode: { address: 129, bit: 0 },        // P129.0: 원격_수동모드
                remoteSemiAutoMode: { address: 129, bit: 1 },      // P129.1: 원격_반자동모드
                remoteSliderSelect: { address: 129, bit: 2 },      // P129.2: 원격_슬라이더선택
                remoteLiftSelect: { address: 129, bit: 3 },        // P129.3: 원격_리프트선택
                remoteFrontSliderSelect: { address: 129, bit: 4 }, // P129.4: 원격_전면슬라이더선택
                remoteRearSliderSelect: { address: 129, bit: 5 },  // P129.5: 원격_후면슬라이더선택
                remoteSimultaneousSelect: { address: 129, bit: 6 }, // P129.6: 원격_동시선택
                
                // 1단 카트 상태 데이터 (P160-P169)
                cartLoadPalletNumber: 160,         // P160: 1단 d4000카트적재파렛번호
                roomSideCounter: 161,              // P161: 룸측카운터
                liftSideCounter: 162,              // P162: 리프트측카운터
                statusMessage1: 163,               // P163: 상태메시지
                statusMessage2: 164,               // P164: 상태메시지
                statusMessage3: 165,               // P165: 상태메시지
                cartToLiftTransferPallet: 166,     // P166: 카트에서 리프트이송파렛번호
                errorList1: 167,                   // P167: 에러리스트
                errorList2: 168,                   // P168: 에러리스트
                errorList3: 169                    // P169: 에러리스트
            },
            // 페이지 3: 2단카트
            page3: {
                // 2단카트 상태 데이터 (P139)
                remoteManualMode: { address: 139, bit: 0 },        // P139.0: 원격_수동모드
                remoteSemiAutoMode: { address: 139, bit: 1 },      // P139.1: 원격_반자동모드
                remoteSliderSelect: { address: 139, bit: 2 },      // P139.2: 원격_슬라이더선택
                remoteLiftSelect: { address: 139, bit: 3 },        // P139.3: 원격_리프트선택
                remoteFrontSliderSelect: { address: 139, bit: 4 }, // P139.4: 원격_전면슬라이더선택
                remoteRearSliderSelect: { address: 139, bit: 5 },  // P139.5: 원격_후면슬라이더선택
                remoteSimultaneousSelect: { address: 139, bit: 6 }, // P139.6: 원격_동시선택
                
                // 2단 카트 상태 데이터 (P170-P179)
                cartLoadPalletNumber: 170,         // P170: 2단 d4000카트적재파렛번호
                roomSideCounter: 171,              // P171: 룸측카운터
                liftSideCounter: 172,              // P172: 리프트측카운터
                statusMessage1: 173,               // P173: 상태메시지
                statusMessage2: 174,               // P174: 상태메시지
                statusMessage3: 175,               // P175: 상태메시지
                cartToLiftTransferPallet: 176,     // P176: 카트에서 리프트이송파렛번호
                errorList1: 177,                   // P177: 에러리스트
                errorList2: 178,                   // P178: 에러리스트
                errorList3: 179                    // P179: 에러리스트
            },
            // 페이지 5: 4단카트
            page5: {
                // 4단카트 상태 데이터 (P149)
                remoteManualMode: { address: 149, bit: 0 },        // P149.0: 원격_수동모드
                remoteSemiAutoMode: { address: 149, bit: 1 },      // P149.1: 원격_반자동모드
                remoteSliderSelect: { address: 149, bit: 2 },      // P149.2: 원격_슬라이더선택
                remoteLiftSelect: { address: 149, bit: 3 },        // P149.3: 원격_리프트선택
                remoteFrontSliderSelect: { address: 149, bit: 4 }, // P149.4: 원격_전면슬라이더선택
                remoteRearSliderSelect: { address: 149, bit: 5 },  // P149.5: 원격_후면슬라이더선택
                remoteSimultaneousSelect: { address: 149, bit: 6 }, // P149.6: 원격_동시선택
                
                // 4단 카트 상태 데이터 (P180-P189)
                cartLoadPalletNumber: 180,         // P180: 4단 d4000카트적재파렛번호
                roomSideCounter: 181,              // P181: 룸측카운터
                liftSideCounter: 182,              // P182: 리프트측카운터
                statusMessage1: 183,               // P183: 상태메시지
                statusMessage2: 184,               // P184: 상태메시지
                statusMessage3: 185,               // P185: 상태메시지
                cartToLiftTransferPallet: 186,     // P186: 카트에서 리프트이송파렛번호
                errorList1: 187,                   // P187: 에러리스트
                errorList2: 188,                   // P188: 에러리스트
                errorList3: 189                    // P189: 에러리스트
            },
            // 페이지 6: 5단카트
            page6: {
                // 5단카트 상태 데이터 (P159)
                remoteManualMode: { address: 159, bit: 0 },        // P159.0: 원격_수동모드
                remoteSemiAutoMode: { address: 159, bit: 1 },      // P159.1: 원격_반자동모드
                remoteSliderSelect: { address: 159, bit: 2 },      // P159.2: 원격_슬라이더선택
                remoteLiftSelect: { address: 159, bit: 3 },        // P159.3: 원격_리프트선택
                remoteFrontSliderSelect: { address: 159, bit: 4 }, // P159.4: 원격_전면슬라이더선택
                remoteRearSliderSelect: { address: 159, bit: 5 },  // P159.5: 원격_후면슬라이더선택
                remoteSimultaneousSelect: { address: 159, bit: 6 }, // P159.6: 원격_동시선택
                
                // 5단 카트 상태 데이터 (P190-P199)
                cartLoadPalletNumber: 190,         // P190: 5단 d4000카트적재파렛번호
                roomSideCounter: 191,              // P191: 룸측카운터
                liftSideCounter: 192,              // P192: 리프트측카운터
                statusMessage1: 193,               // P193: 상태메시지
                statusMessage2: 194,               // P194: 상태메시지
                statusMessage3: 195,               // P195: 상태메시지
                cartToLiftTransferPallet: 196,     // P196: 카트에서 리프트이송파렛번호
                errorList1: 197,                   // P197: 에러리스트
                errorList2: 198,                   // P198: 에러리스트
                errorList3: 199                    // P199: 에러리스트
            }
        },

    // 센서 비트 매핑 (PLC 체크리스트용) 
    sensorMapping: {
        // P100 (P100.0~P100.F) - 리프트 입력 센서
        p100: {
            address: 100,
            sensors: {
                0: { name: "P100.0_OP비상정지", description: "OP 비상정지", category: "리프트" },
                4: { name: "P100.4_앞범퍼", description: "앞범퍼", category: "리프트" },
                5: { name: "P100.5_뒷범퍼", description: "뒷범퍼", category: "리프트" },
                6: { name: "P100.6_좌도어확인", description: "좌도어 확인", category: "리프트" },
                7: { name: "P100.7_우도어확인", description: "우도어 확인", category: "리프트" },
                8: { name: "P100.8_차량감지", description: "차량 감지", category: "리프트" },
                9: { name: "P100.9_도어잠", description: "도어 잠", category: "리프트" },
                10: { name: "P100.A_승용높이", description: "승용 높이", category: "리프트" },
                11: { name: "P100.B_RV높이", description: "RV 높이", category: "리프트" },
                14: { name: "P100.E_도어열림", description: "도어 열림", category: "리프트" },
                15: { name: "P100.F_도어닫힘", description: "도어 닫힘", category: "리프트" }
            }
        },

        // P101 (P101.0~P101.F) - 리프트 입력 센서
        p101: {
            address: 101,
            sensors: {
                0: { name: "P101.0_와이어절단", description: "와이어 절단", category: "리프트" },
                1: { name: "P101.1_상승비상", description: "상승 비상", category: "리프트" },
                2: { name: "P101.2_홈감지", description: "홈 감지", category: "리프트" },
                3: { name: "P101.3_1단확인", description: "1단 확인", category: "리프트" },
                4: { name: "P101.4_2단확인", description: "2단 확인", category: "리프트" },
                5: { name: "P101.5_3단확인", description: "3단 확인", category: "리프트" },
                6: { name: "P101.6_4단확인", description: "4단 확인", category: "리프트" },
                7: { name: "P101.7_5단확인", description: "5단 확인", category: "리프트" },
                8: { name: "P101.8_6단확인", description: "6단 확인", category: "리프트" },
                9: { name: "P101.9_좌도어확인", description: "좌도어 확인", category: "리프트" },
                10: { name: "P101.A_앞범퍼", description: "앞범퍼", category: "리프트" },
                11: { name: "P101.B_하강비상", description: "하강 비상", category: "리프트" },
                12: { name: "P101.C_상승감속", description: "상승 감속", category: "리프트" },
                13: { name: "P101.D_하강감속", description: "하강 감속", category: "리프트" },
                14: { name: "P101.E_레벨상", description: "레벨 상", category: "리프트" },
                15: { name: "P101.F_레벨하", description: "레벨 하", category: "리프트" }
            }
        },

        // P102 (P102.0~P102.F) - 리프트 입력 센서
        p102: {
            address: 102,
            sensors: {
                0: { name: "P102.0_리모콘비상정지", description: "리모콘 비상정지", category: "리프트" },
                1: { name: "P102.1_수동선택", description: "수동 선택", category: "리프트" },
                2: { name: "P102.2_센터링선택", description: "센터링 선택", category: "리프트" },
                3: { name: "P102.3_상승버튼", description: "상승 버튼", category: "리프트" },
                4: { name: "P102.4_하강버튼", description: "하강 버튼", category: "리프트" },
                5: { name: "P102.5_센터링정렬/스토퍼상승", description: "센터링 정렬/스토퍼 상승", category: "리프트" },
                6: { name: "P102.6_센터링해제/스토퍼하강", description: "센터링 해제/스토퍼 하강", category: "리프트" },
                7: { name: "P102.7_고속버튼", description: "고속 버튼", category: "리프트" },
                8: { name: "P102.8_리셋버튼", description: "리셋 버튼", category: "리프트" },
                9: { name: "P102.9_차량감지", description: "차량 감지", category: "리프트" },
                10: { name: "P102.A_강제수동", description: "강제 수동", category: "리프트" },
                11: { name: "P102.B_승용높이", description: "승용 높이", category: "리프트" },
                12: { name: "P102.C_리프트BK_이상", description: "리프트 BK 이상", category: "리프트" },
                13: { name: "P102.D_RV높이", description: "RV 높이", category: "리프트" },
                15: { name: "P102.F_도어측피트", description: "도어측 피트", category: "리프트" }
            }
        },

        // P103 (P103.0~P103.F) - 리프트 입력 센서
        p103: {
            address: 103,
            sensors: {
                1: { name: "P103.1_인버터런", description: "인버터 RUN", category: "리프트" },
                2: { name: "P103.2_리프트모터TH", description: "리프트 모터 TH", category: "리프트" },
                3: { name: "P103.3_도어모터TH", description: "도어 모터 TH", category: "리프트" },
                4: { name: "P103.4_센터링모터TH", description: "센터링 모터 TH", category: "리프트" },
                5: { name: "P103.5_스톱퍼모터TH", description: "스톱퍼 모터 TH", category: "리프트" },
                6: { name: "P103.6_외장턴모터TH", description: "외장턴 모터 TH", category: "리프트" },
                8: { name: "P103.8_바퀴감지", description: "바퀴 감지", category: "리프트" },
                9: { name: "P103.9_슬라이딩돌출거울측", description: "슬라이딩 돌출 거울측", category: "리프트" },
                10: { name: "P103.A_슬라이딩돌출도어측", description: "슬라이딩 돌출 도어측", category: "리프트" },
                11: { name: "P103.B_차량하부감지", description: "차량 하부 감지", category: "리프트" },
                12: { name: "P103.C_좌측센터링열림", description: "좌측 센터링 열림", category: "리프트" },
                13: { name: "P103.D_우측센터링열림", description: "우측 센터링 열림", category: "리프트" },
                14: { name: "P103.E_스톱퍼상승정지", description: "스톱퍼 상승 정지", category: "리프트" },
                15: { name: "P103.F_스톱퍼하강정지", description: "스톱퍼 하강 정지", category: "리프트" }
            }
        },

        // P104 (P104.0~P104.F) - 리프트 출력 센서
        p104: {
            address: 104,
            sensors: {
                0: { name: "P104.0_인버터정", description: "인버터 정방향", category: "리프트" },
                1: { name: "P104.1_인버터역", description: "인버터 역방향", category: "리프트" },
                2: { name: "P104.2_인버터리셋", description: "인버터 리셋", category: "리프트" },
                3: { name: "P104.3_다단속1", description: "다단속 1", category: "리프트" },
                4: { name: "P104.4_다단속2", description: "다단속 2", category: "리프트" },
                5: { name: "P104.5_다단속3", description: "다단속 3", category: "리프트" },
                8: { name: "P104.8_유도등1", description: "유도등 1", category: "리프트" },
                9: { name: "P104.9_유도등2", description: "유도등 2", category: "리프트" },
                10: { name: "P104.A_유도등4", description: "유도등 4", category: "리프트" },
                11: { name: "P104.B_유도등8", description: "유도등 8", category: "리프트" },
                12: { name: "P104.C_적색신호등", description: "적색 신호등", category: "리프트" },
                13: { name: "P104.D_녹색신호등", description: "녹색 신호등", category: "리프트" },
                14: { name: "P104.E_부저정상", description: "부저 정상", category: "리프트" },
                15: { name: "P104.F_부저에러", description: "부저 에러", category: "리프트" }
            }
        },

        // P005 (P105.0~P105.8) - 리프트 출력 센서
        p105: {
            address: 105,
            sensors: {
                0: { name: "P105.0_리프트모터MC", description: "리프트 모터 MC", category: "리프트" },
                1: { name: "P105.1_리프트BKMC", description: "리프트 BK MC", category: "리프트" },
                2: { name: "P105.2_도어MC", description: "도어 MC", category: "리프트" },
                3: { name: "P105.3_센터링잠김MC", description: "센터링 잠김 MC", category: "리프트" },
                4: { name: "P105.4_센터링열림MC", description: "센터링 열림 MC", category: "리프트" },
                5: { name: "P105.5_스톱퍼상승MC", description: "스톱퍼 상승 MC", category: "리프트" },
                6: { name: "P105.6_스톱퍼하강MC", description: "스톱퍼 하강 MC", category: "리프트" },
                7: { name: "P105.7_외장턴정MC", description: "외장 턴 정방향 MC", category: "리프트" },
                8: { name: "P105.8_외장턴역MC", description: "외장 턴 역방향 MC", category: "리프트" }
            }
        },
        // P120 (P120.0~P120.F) - 1단카트 센서
        p120: {
            address: 120,
            sensors: {
                0: { name: "P120.0_카트말굽1_리프트측", description: "카트말굽1_리프트측", category: "1단카트" },
                1: { name: "P120.1_카트말굽2_리프트측", description: "카트말굽2_리프트측", category: "1단카트" },
                2: { name: "P120.2_카트말굽1_룸측", description: "카트말굽1_룸측", category: "1단카트" },
                3: { name: "P120.3_카트말굽2_룸측", description: "카트말굽2_룸측", category: "1단카트" },
                4: { name: "P120.4_전면말굽1_슬라이더", description: "전면말굽1_슬라이더", category: "1단카트" },
                5: { name: "P120.5_전면말굽2_슬라이더", description: "전면말굽2_슬라이더", category: "1단카트" },
                6: { name: "P120.6_후면말굽1_슬라이더", description: "후면말굽1_슬라이더", category: "1단카트" },
                7: { name: "P120.7_후면말굽2_슬라이더", description: "후면말굽2_슬라이더", category: "1단카트" },
                8: { name: "P120.8_리프트측_차량돌출", description: "리프트측_차량돌출", category: "1단카트" },
                9: { name: "P120.9_룸측_차량_돌출", description: "룸측_차량_돌출", category: "1단카트" },
                10: { name: "P120.A_카트_차량감지", description: "카트_차량감지", category: "1단카트" },
                12: { name: "P120.C_끝번감속_시작비상", description: "끝번감속_시작비상", category: "1단카트" },
                13: { name: "P120.D_시작감속_끝번비상", description: "시작감속_끝번비상", category: "1단카트" },
                14: { name: "P120.E_홈확인", description: "홈확인", category: "1단카트" },
                15: { name: "P120.F_리프트확인", description: "리프트확인", category: "1단카트" },
            }
        },
        // P121 (P121.0~P121.F) - 1단카트 센서
        p121: {
            address: 121,
            sensors: {
                0: { name: "P121.0_전면_슬라이더_돌출", description: "전면_슬라이더_돌출", category: "1단카트" },
                1: { name: "P121.1_후면_슬라이더_돌출", description: "후면_슬라이더_돌출", category: "1단카트" },
                2: { name: "P121.2_전면_슬라이더_로더정위치", description: "전면_슬라이더_로더정위치", category: "1단카트" },
                3: { name: "P121.3_전면_슬라이더_언로더정위치", description: "전면_슬라이더_언로더정위치", category: "1단카트" },
                4: { name: "P121.4_로더비상_전면_슬라이더", description: "로더비상_전면_슬라이더", category: "1단카트" },
                5: { name: "P121.5_언로더비상_전면_슬라이더", description: "언로더비상_전면_슬라이더", category: "1단카트" },
                6: { name: "P121.6_후면_슬라이더_로더정위치", description: "후면_슬라이더_로더정위치", category: "1단카트" },
                7: { name: "P121.7_후면_슬라이더_언로더정위치", description: "후면_슬라이더_언로더정위치", category: "1단카트" },
                8: { name: "P121.8_로더비상_후면_슬라이더", description: "후면_슬라이더_로더비상", category: "1단카트" },
                9: { name: "P121.9_언로더비상_후면_슬라이더", description: "후면_슬라이더_언로더비상", category: "1단카트" },
                11: { name: "P121.B_후면_슬라이더_바퀴감지", description: "후면_슬라이더_바퀴감지", category: "1단카트" },
                12: { name: "P121.C_리프트측_차량감지", description: "리프트측_차량감지", category: "1단카트" },
                13: { name: "P121.D_룸측_차량감지", description: "룸측_차량감지", category: "1단카트" },
            }
        },
        // P122 (P122.0~P122.F) - 1단카트 센서
        p122: {
            address: 122,
            sensors: {
                0: { name: "P122.0_수동", description: "수동", category: "1단카트" },
                1: { name: "P122.1_자동", description: "자동", category: "1단카트" },
                2: { name: "P122.2_슬라이더선택", description: "슬라이더선택", category: "1단카트" },
                3: { name: "P122.3_리프트측선택", description: "리프트측선택", category: "1단카트" },
                4: { name: "P122.4_슬라이더_전면선택", description: "슬라이더_전면선택", category: "1단카트" },
                5: { name: "P122.5_슬라이더_후면선택", description: "슬라이더_후면선택", category: "1단카트" },
                6: { name: "P122.6_끝번주행_버튼", description: "끝번주행_버튼", category: "1단카트" },
                7: { name: "P122.7_시작주행_버튼", description: "시작주행_버튼", category: "1단카트" },
                8: { name: "P122.8_격납_버튼_로드", description: "격납_버튼_로드", category: "1단카트" },
                9: { name: "P122.9_추출_버튼_언로드", description: "추출_버튼_언로드", category: "1단카트" },
                10: { name: "P122.A_고속_버튼", description: "고속_버튼", category: "1단카트" },
                11: { name: "P122.B_리셋_버튼", description: "리셋_버튼", category: "1단카트" },
                12: { name: "P122.C_비상_버튼", description: "비상_버튼", category: "1단카트" },
            }
        },
        // P123 (P123.0~P123.F) - 1단카트 센서
        p123: {
            address: 123,
            sensors: {
                0: { name: "P123.0_인버터fwd", description: "인버터fwd", category: "1단카트" },
                1: { name: "P123.1_인버터rev", description: "인버터rev", category: "1단카트" },
                3: { name: "P123.3_인버터리셋", description: "인버터리셋", category: "1단카트" },
                4: { name: "P123.4_인버터SP1", description: "인버터SP1", category: "1단카트" },
                5: { name: "P123.5_인버터SP2", description: "인버터SP2", category: "1단카트" },
                6: { name: "P123.6_인버터SP3", description: "인버터SP3", category: "1단카트" },
                7: { name: "P123.7_부져", description: "부져", category: "1단카트" },
                8: { name: "P123.8_리프트측_정위치", description: "리프트측_정위치", category: "1단카트" },
                9: { name: "P123.9_룸측_정위치", description: "룸측_정위치", category: "1단카트" },
                10: { name: "P123.A_전면_정위치_슬라이더", description: "전면_정위치_슬라이더", category: "1단카트" },
                11: { name: "P123.B_후면_정위치_슬라이더", description: "후면_정위치_슬라이더", category: "1단카트" },
                12: { name: "P123.C_전면_로드", description: "전면_로드", category: "1단카트" },
                13: { name: "P123.D_전면_언로드", description: "전면_언로드", category: "1단카트" },
                14: { name: "P123.E_후면_로드", description: "후면_로드", category: "1단카트" },
                15: { name: "P123.F_후면_언로드", description: "후면_언로드", category: "1단카트" },
            }
        },
        // P125 (P125.0~P125.F) - 1단카트 센서
        p125: {
            address: 125,
            sensors: {
                0: { name: "P125.0_주행모터트립", description: "주행모터트립", category: "1단카트" },
                1: { name: "P125.1_전면슬라이더 주행트립", description: "전면슬라이더 주행트립", category: "1단카트" },
                2: { name: "P125.2_후면슬라이더 주행트립", description: "후면슬라이더 주행트립", category: "1단카트" },
                3: { name: "P125.3_전면슬라이더로더트랩", description: "전면슬라이더로더트랩", category: "1단카트" },
                4: { name: "P125.4_후면슬라이더로더트랩", description: "후면슬라이더로더트랩", category: "1단카트" },
            }
        },
        // P130 (P130.0~P130.F) - 2단카트 센서
        p130: {
            address: 130,
            sensors: {
                0: { name: "P130.0_카트말굽1_리프트측", description: "카트말굽1_리프트측", category: "2단카트" },
                1: { name: "P130.1_카트말굽2_리프트측", description: "카트말굽2_리프트측", category: "2단카트" },
                2: { name: "P130.2_카트말굽1_룸측", description: "카트말굽1_룸측", category: "2단카트" },
                3: { name: "P130.3_카트말굽2_룸측", description: "카트말굽2_룸측", category: "2단카트" },
                4: { name: "P130.4_전면말굽1_슬라이더", description: "전면말굽1_슬라이더", category: "2단카트" },
                5: { name: "P130.5_전면말굽2_슬라이더", description: "전면말굽2_슬라이더", category: "2단카트" },
                6: { name: "P130.6_후면말굽1_슬라이더", description: "후면말굽1_슬라이더", category: "2단카트" },
                7: { name: "P130.7_후면말굽2_슬라이더", description: "후면말굽2_슬라이더", category: "2단카트" },
                8: { name: "P130.8_리프트측_차량돌출", description: "리프트측_차량돌출", category: "2단카트" },
                9: { name: "P130.9_룸측_차량_돌출", description: "룸측_차량_돌출", category: "2단카트" },
                10: { name: "P130.A_카트_차량감지", description: "카트_차량감지", category: "2단카트" },
                12: { name: "P130.C_끝번감속_시작비상", description: "끝번감속_시작비상", category: "2단카트" },
                13: { name: "P130.D_시작감속_끝번비상", description: "시작감속_끝번비상", category: "2단카트" },
                14: { name: "P130.E_홈확인", description: "홈확인", category: "2단카트" },
                15: { name: "P130.F_리프트확인", description: "리프트확인", category: "2단카트" },
            }
        },
        // P131 (P131.0~P131.F) - 2단카트 센서
        p131: {
            address: 131,
            sensors: {
                0: { name: "P131.0_전면_슬라이더_돌출", description: "전면_슬라이더_돌출", category: "2단카트" },
                1: { name: "P131.1_후면_슬라이더_돌출", description: "후면_슬라이더_돌출", category: "2단카트" },
                2: { name: "P131.2_전면_슬라이더_로더정위치", description: "전면_슬라이더_로더정위치", category: "2단카트" },
                3: { name: "P131.3_전면_슬라이더_언로더정위치", description: "전면_슬라이더_언로더정위치", category: "2단카트" },
                4: { name: "P131.4_로더비상_전면_슬라이더", description: "로더비상_전면_슬라이더", category: "2단카트" },
                5: { name: "P131.5_언로더비상_후면_슬라이더", description: "언로더비상_후면_슬라이더", category: "2단카트" },
                6: { name: "P131.6_후면_슬라이더_로더정위치", description: "후면_슬라이더_로더정위치", category: "2단카트" },
                7: { name: "P131.7_후면_슬라이더_언로더정위치", description: "후면_슬라이더_언로더정위치", category: "2단카트" },
                8: { name: "P131.8_후면_슬라이더_로더비상", description: "후면_슬라이더_로더비상", category: "2단카트" },
                9: { name: "P131.9_후면_슬라이더_언로더비상", description: "후면_슬라이더_언로더비상", category: "2단카트" },
                11: { name: "P131.B_후면_슬라이더_바퀴감지", description: "후면_슬라이더_바퀴감지", category: "2단카트" },
                12: { name: "P131.C_리프트측_차량감지", description: "리프트측_차량감지", category: "2단카트" },
                13: { name: "P131.D_룸측_차량감지", description: "룸측_차량감지", category: "2단카트" },
            }
        },
        // P132 (P132.0~P132.F) - 2단카트 센서
        p132: {
            address: 132,
            sensors: {
                0: { name: "P132.0_수동", description: "수동", category: "2단카트" },
                1: { name: "P132.1_자동", description: "자동", category: "2단카트" },
                2: { name: "P132.2_슬라이더선택", description: "슬라이더선택", category: "2단카트" },
                3: { name: "P132.3_리프트측선택", description: "리프트측선택", category: "2단카트" },
                4: { name: "P132.4_슬라이더_전면선택", description: "슬라이더_전면선택", category: "2단카트" },
                5: { name: "P132.5_슬라이더_후면선택", description: "슬라이더_후면선택", category: "2단카트" },
                6: { name: "P132.6_끝번주행_버튼", description: "끝번주행_버튼", category: "2단카트" },
                7: { name: "P132.7_시작주행_버튼", description: "시작주행_버튼", category: "2단카트" },
                8: { name: "P132.8_격납_버튼_로드", description: "격납_버튼_로드", category: "2단카트" },
                9: { name: "P132.9_추출_버튼_언로드", description: "추출_버튼_언로드", category: "2단카트" },
                10: { name: "P132.A_고속_버튼", description: "고속_버튼", category: "2단카트" },
                11: { name: "P132.B_리셋_버튼", description: "리셋_버튼", category: "2단카트" },
                12: { name: "P132.C_비상_버튼", description: "비상_버튼", category: "2단카트" },
            }
        },
        // P133 (P133.0~P133.F) - 2단카트 센서
        p133: {
            address: 133,
            sensors: {
                0: { name: "P133.0_인버터fwd", description: "인버터fwd", category: "2단카트" },
                1: { name: "P133.1_인버터rev", description: "인버터rev", category: "2단카트" },
                3: { name: "P133.3_인버터리셋", description: "인버터리셋", category: "2단카트" },
                4: { name: "P133.4_인버터SP1", description: "인버터SP1", category: "2단카트" },
                5: { name: "P133.5_인버터SP2", description: "인버터SP2", category: "2단카트" },
                6: { name: "P133.6_인버터SP3", description: "인버터SP3", category: "2단카트" },
                7: { name: "P133.7_부져", description: "부져", category: "2단카트" },
                8: { name: "P133.8_리프트측_정위치", description: "리프트측_정위치", category: "2단카트" },
                9: { name: "P133.9_룸측_정위치", description: "룸측_정위치", category: "2단카트" },
                10: { name: "P133.A_전면_정위치_슬라이더", description: "전면_정위치_슬라이더", category: "2단카트" },
                11: { name: "P133.B_후면_정위치_슬라이더", description: "후면_정위치_슬라이더", category: "2단카트" },
                12: { name: "P133.C_전면_로드", description: "전면_로드", category: "2단카트" },
                13: { name: "P133.D_전면_언로드", description: "전면_언로드", category: "2단카트" },
                14: { name: "P133.E_후면_로드", description: "후면_로드", category: "2단카트" },
                15: { name: "P133.F_후면_언로드", description: "후면_언로드", category: "2단카트" },
            }
        },
        // P135 (P135.0~P135.F) - 2단카트 센서
        p135: {
            address: 135,
            sensors: {
                0: { name: "P135.0_주행모터트립", description: "주행모터트립", category: "2단카트" },
                1: { name: "P135.1_전면슬라이더 주행트립", description: "전면슬라이더 주행트립", category: "2단카트" },
                2: { name: "P135.2_후면슬라이더 주행트립", description: "후면슬라이더 주행트립", category: "2단카트" },
                3: { name: "P135.3_전면슬라이더로더트랩", description: "전면슬라이더로더트랩", category: "2단카트" },
                4: { name: "P135.4_후면슬라이더로더트랩", description: "후면슬라이더로더트랩", category: "2단카트" },
            }
        },
        // P140 (P140.0~P140.F) - 4단카트 센서
        p140: {
            address: 140,
            sensors: {
                0: { name: "P140.0_카트말굽1_리프트측", description: "카트말굽1_리프트측", category: "4단카트" },
                1: { name: "P140.1_카트말굽2_리프트측", description: "카트말굽2_리프트측", category: "4단카트" },
                2: { name: "P140.2_카트말굽1_룸측", description: "카트말굽1_룸측", category: "4단카트" },
                3: { name: "P140.3_카트말굽2_룸측", description: "카트말굽2_룸측", category: "4단카트" },
                4: { name: "P140.4_전면말굽1_슬라이더", description: "전면말굽1_슬라이더", category: "4단카트" },
                5: { name: "P140.5_전면말굽2_슬라이더", description: "전면말굽2_슬라이더", category: "4단카트" },
                6: { name: "P140.6_후면말굽1_슬라이더", description: "후면말굽1_슬라이더", category: "4단카트" },
                7: { name: "P140.7_후면말굽2_슬라이더", description: "후면말굽2_슬라이더", category: "4단카트" },
                8: { name: "P140.8_리프트측_차량돌출", description: "리프트측_차량돌출", category: "4단카트" },
                9: { name: "P140.9_룸측_차량_돌출", description: "룸측_차량_돌출", category: "4단카트" },
                10: { name: "P140.A_카트_차량감지", description: "카트_차량감지", category: "4단카트" },
                12: { name: "P140.C_끝번감속_시작비상", description: "끝번감속_시작비상", category: "4단카트" },
                13: { name: "P140.D_시작감속_끝번비상", description: "시작감속_끝번비상", category: "4단카트" },
                14: { name: "P140.E_홈확인", description: "홈확인", category: "4단카트" },
                15: { name: "P140.F_리프트확인", description: "리프트확인", category: "4단카트" },
            }
        },
        // P141 (P141.0~P141.F) - 4단카트 센서
        p141: {
            address: 141,
            sensors: {
                0: { name: "P141.0_전면_슬라이더_돌출", description: "전면_슬라이더_돌출", category: "4단카트" },
                1: { name: "P141.1_후면_슬라이더_돌출", description: "후면_슬라이더_돌출", category: "4단카트" },
                2: { name: "P141.2_전면_슬라이더_로더정위치", description: "전면_슬라이더_로더정위치", category: "4단카트" },
                3: { name: "P141.3_전면_슬라이더_언로더정위치", description: "전면_슬라이더_언로더정위치", category: "4단카트" },
                4: { name: "P141.4_로더비상_전면_슬라이더", description: "로더비상_전면_슬라이더", category: "4단카트" },
                5: { name: "P141.5_언로더비상_후면_슬라이더", description: "언로더비상_후면_슬라이더", category: "4단카트" },
                6: { name: "P141.6_후면_슬라이더_로더정위치", description: "후면_슬라이더_로더정위치", category: "4단카트" },
                7: { name: "P141.7_후면_슬라이더_언로더정위치", description: "후면_슬라이더_언로더정위치", category: "4단카트" },
                8: { name: "P141.8_후면_슬라이더_로더비상", description: "후면_슬라이더_로더비상", category: "4단카트" },
                9: { name: "P141.9_후면_슬라이더_언로더비상", description: "후면_슬라이더_언로더비상", category: "4단카트" },
                11: { name: "P141.B_후면_슬라이더_바퀴감지", description: "후면_슬라이더_바퀴감지", category: "4단카트" },
                12: { name: "P141.C_리프트측_차량감지", description: "리프트측_차량감지", category: "4단카트" },
                13: { name: "P141.D_룸측_차량감지", description: "룸측_차량감지", category: "4단카트" },
            }
        },
        // P142 (P142.0~P142.F) - 4단카트 센서
        p142: {
            address: 142,
            sensors: {
                0: { name: "P142.0_수동", description: "수동", category: "4단카트" },
                1: { name: "P142.1_자동", description: "자동", category: "4단카트" },
                2: { name: "P142.2_슬라이더선택", description: "슬라이더선택", category: "4단카트" },
                3: { name: "P142.3_리프트측선택", description: "리프트측선택", category: "4단카트" },
                4: { name: "P142.4_슬라이더_전면선택", description: "슬라이더_전면선택", category: "4단카트" },
                5: { name: "P142.5_슬라이더_후면선택", description: "슬라이더_후면선택", category: "4단카트" },
                6: { name: "P142.6_끝번주행_버튼", description: "끝번주행_버튼", category: "4단카트" },
                7: { name: "P142.7_시작주행_버튼", description: "시작주행_버튼", category: "4단카트" },
                8: { name: "P142.8_격납_버튼_로드", description: "격납_버튼_로드", category: "4단카트" },
                9: { name: "P142.9_추출_버튼_언로드", description: "추출_버튼_언로드", category: "4단카트" },
                10: { name: "P142.A_고속_버튼", description: "고속_버튼", category: "4단카트" },
                11: { name: "P142.B_리셋_버튼", description: "리셋_버튼", category: "4단카트" },
                12: { name: "P142.C_비상_버튼", description: "비상_버튼", category: "4단카트" },
            }
        },
        // P143 (P143.0~P143.F) - 4단카트 센서
        p143: {
            address: 143,
            sensors: {
                0: { name: "P143.0_인버터fwd", description: "인버터fwd", category: "4단카트" },
                1: { name: "P143.1_인버터rev", description: "인버터rev", category: "4단카트" },
                3: { name: "P143.3_인버터리셋", description: "인버터리셋", category: "4단카트" },
                4: { name: "P143.4_인버터SP1", description: "인버터SP1", category: "4단카트" },
                5: { name: "P143.5_인버터SP2", description: "인버터SP2", category: "4단카트" },
                6: { name: "P143.6_인버터SP3", description: "인버터SP3", category: "4단카트" },
                7: { name: "P143.7_부져", description: "부져", category: "4단카트" },
                8: { name: "P143.8_리프트측_정위치", description: "리프트측_정위치", category: "4단카트" },
                9: { name: "P143.9_룸측_정위치", description: "룸측_정위치", category: "4단카트" },
                10: { name: "P143.A_전면_정위치_슬라이더", description: "전면_정위치_슬라이더", category: "4단카트" },
                11: { name: "P143.B_후면_정위치_슬라이더", description: "후면_정위치_슬라이더", category: "4단카트" },
                12: { name: "P143.C_전면_로드", description: "전면_로드", category: "4단카트" },
                13: { name: "P143.D_전면_언로드", description: "전면_언로드", category: "4단카트" },
                14: { name: "P143.E_후면_로드", description: "후면_로드", category: "4단카트" },
                15: { name: "P143.F_후면_언로드", description: "후면_언로드", category: "4단카트" },
            }
        },
        // P145 (P145.0~P145.F) - 4단카트 센서
        p145: {
            address: 145,
            sensors: {
                0: { name: "P145.0_주행모터트립", description: "주행모터트립", category: "4단카트" },
                1: { name: "P145.1_전면슬라이더 주행트립", description: "전면슬라이더 주행트립", category: "4단카트" },
                2: { name: "P145.2_후면슬라이더 주행트립", description: "후면슬라이더 주행트립", category: "4단카트" },
                3: { name: "P145.3_전면슬라이더로더트랩", description: "전면슬라이더로더트랩", category: "4단카트" },
                4: { name: "P145.4_후면슬라이더로더트랩", description: "후면슬라이더로더트랩", category: "4단카트" },
            }
        },
        // P150 (P150.0~P150.F) - 5단카트 센서
        p150: {
            address: 150,
            sensors: {
                0: { name: "P150.0_카트말굽1_리프트측", description: "카트말굽1_리프트측", category: "5단카트" },
                1: { name: "P150.1_카트말굽2_리프트측", description: "카트말굽2_리프트측", category: "5단카트" },
                2: { name: "P150.2_카트말굽1_룸측", description: "카트말굽1_룸측", category: "5단카트" },
                3: { name: "P150.3_카트말굽2_룸측", description: "카트말굽2_룸측", category: "5단카트" },
                4: { name: "P150.4_전면말굽1_슬라이더", description: "전면말굽1_슬라이더", category: "5단카트" },
                5: { name: "P150.5_전면말굽2_슬라이더", description: "전면말굽2_슬라이더", category: "5단카트" },
                6: { name: "P150.6_후면말굽1_슬라이더", description: "후면말굽1_슬라이더", category: "5단카트" },
                7: { name: "P150.7_후면말굽2_슬라이더", description: "후면말굽2_슬라이더", category: "5단카트" },
                8: { name: "P150.8_리프트측_차량돌출", description: "리프트측_차량돌출", category: "5단카트" },
                9: { name: "P150.9_룸측_차량_돌출", description: "룸측_차량_돌출", category: "5단카트" },
                10: { name: "P150.A_카트_차량감지", description: "카트_차량감지", category: "5단카트" },
                12: { name: "P150.C_끝번감속_시작비상", description: "끝번감속_시작비상", category: "5단카트" },
                13: { name: "P150.D_시작감속_끝번비상", description: "시작감속_끝번비상", category: "5단카트" },
                14: { name: "P150.E_홈확인", description: "홈확인", category: "5단카트" },
                15: { name: "P150.F_리프트확인", description: "리프트확인", category: "5단카트" },
            }
        },
        // P151 (P151.0~P151.F) - 5단카트 센서
        p151: {
            address: 151,
            sensors: {
                0: { name: "P151.0_전면_슬라이더_돌출", description: "전면_슬라이더_돌출", category: "5단카트" },
                1: { name: "P151.1_후면_슬라이더_돌출", description: "후면_슬라이더_돌출", category: "5단카트" },
                2: { name: "P151.2_전면_슬라이더_로더정위치", description: "전면_슬라이더_로더정위치", category: "5단카트" },
                3: { name: "P151.3_전면_슬라이더_언로더정위치", description: "전면_슬라이더_언로더정위치", category: "5단카트" },
                4: { name: "P151.4_로더비상_전면_슬라이더", description: "로더비상_전면_슬라이더", category: "5단카트" },
                5: { name: "P151.5_언로더비상_후면_슬라이더", description: "언로더비상_후면_슬라이더", category: "5단카트" },
                6: { name: "P151.6_후면_슬라이더_로더정위치", description: "후면_슬라이더_로더정위치", category: "5단카트" },
                7: { name: "P151.7_후면_슬라이더_언로더정위치", description: "후면_슬라이더_언로더정위치", category: "5단카트" },
                8: { name: "P151.8_후면_슬라이더_로더비상", description: "후면_슬라이더_로더비상", category: "5단카트" },
                9: { name: "P151.9_후면_슬라이더_언로더비상", description: "후면_슬라이더_언로더비상", category: "5단카트" },
                11: { name: "P151.B_후면_슬라이더_바퀴감지", description: "후면_슬라이더_바퀴감지", category: "5단카트" },
                12: { name: "P151.C_리프트측_차량감지", description: "리프트측_차량감지", category: "5단카트" },
                13: { name: "P151.D_룸측_차량감지", description: "룸측_차량감지", category: "5단카트" },
            }
        },
        // P152 (P152.0~P152.F) - 5단카트 센서
        p152: {
            address: 152,
            sensors: {
                0: { name: "P152.0_수동", description: "수동", category: "5단카트" },
                1: { name: "P152.1_자동", description: "자동", category: "5단카트" },
                2: { name: "P152.2_슬라이더선택", description: "슬라이더선택", category: "5단카트" },
                3: { name: "P152.3_리프트측선택", description: "리프트측선택", category: "5단카트" },
                4: { name: "P152.4_슬라이더_전면선택", description: "슬라이더_전면선택", category: "5단카트" },
                5: { name: "P152.5_슬라이더_후면선택", description: "슬라이더_후면선택", category: "5단카트" },
                6: { name: "P152.6_끝번주행_버튼", description: "끝번주행_버튼", category: "5단카트" },
                7: { name: "P152.7_시작주행_버튼", description: "시작주행_버튼", category: "5단카트" },
                8: { name: "P152.8_격납_버튼_로드", description: "격납_버튼_로드", category: "5단카트" },
                9: { name: "P152.9_추출_버튼_언로드", description: "추출_버튼_언로드", category: "5단카트" },
                10: { name: "P152.A_고속_버튼", description: "고속_버튼", category: "5단카트" },
                11: { name: "P152.B_리셋_버튼", description: "리셋_버튼", category: "5단카트" },
                12: { name: "P152.C_비상_버튼", description: "비상_버튼", category: "5단카트" },
            }
        },
        // P153 (P153.0~P153.F) - 5단카트 센서
        p153: {
            address: 153,
            sensors: {
                0: { name: "P153.0_인버터fwd", description: "인버터fwd", category: "5단카트" },
                1: { name: "P153.1_인버터rev", description: "인버터rev", category: "5단카트" },
                3: { name: "P153.3_인버터리셋", description: "인버터리셋", category: "5단카트" },
                4: { name: "P153.4_인버터SP1", description: "인버터SP1", category: "5단카트" },
                5: { name: "P153.5_인버터SP2", description: "인버터SP2", category: "5단카트" },
                6: { name: "P153.6_인버터SP3", description: "인버터SP3", category: "5단카트" },
                7: { name: "P153.7_부져", description: "부져", category: "5단카트" },
                8: { name: "P153.8_리프트측_정위치", description: "리프트측_정위치", category: "5단카트" },
                9: { name: "P153.9_룸측_정위치", description: "룸측_정위치", category: "5단카트" },
                10: { name: "P153.A_전면_정위치_슬라이더", description: "전면_정위치_슬라이더", category: "5단카트" },
                11: { name: "P153.B_후면_정위치_슬라이더", description: "후면_정위치_슬라이더", category: "5단카트" },
                12: { name: "P153.C_전면_로드", description: "전면_로드", category: "5단카트" },
                13: { name: "P153.D_전면_언로드", description: "전면_언로드", category: "5단카트" },
                14: { name: "P153.E_후면_로드", description: "후면_로드", category: "5단카트" },
                15: { name: "P153.F_후면_언로드", description: "후면_언로드", category: "5단카트" },
            }
        },
        // P155 (P155.0~P155.F) - 5단카트 센서
        p155: {
            address: 155,
            sensors: {
                0: { name: "P155.0_주행모터트립", description: "주행모터트립", category: "5단카트" },
                1: { name: "P155.1_전면슬라이더 주행트립", description: "전면슬라이더 주행트립", category: "5단카트" },
                2: { name: "P155.2_후면슬라이더 주행트립", description: "후면슬라이더 주행트립", category: "5단카트" },
                3: { name: "P155.3_전면슬라이더로더트랩", description: "전면슬라이더로더트랩", category: "5단카트" },
                4: { name: "P155.4_후면슬라이더로더트랩", description: "후면슬라이더로더트랩", category: "5단카트" },
            }
        }
    },

    api: {
        baseUrl: '',
        devPort: 5123,
        endpoints: {
            recent: '/api/parkingevents/recent',
            parked: '/api/parkingevents/parked',
            statistics: '/api/parkingevents/statistics',
            search: '/api/parkingevents/search'
        }
    },

    cctvConfig: {
        channels: [
            { number: 1, name: 'Channel 1 (D1)' },
            { number: 2, name: 'Channel 2 (D2)' },
            { number: 3, name: 'Channel 3 (D3)' },
            { number: 4, name: 'Channel 4 (D4)' },
            { number: 5, name: 'Channel 5 (D5)' },
            { number: 6, name: 'Channel 6 (D6)' },
            { number: 7, name: 'Channel 7 (D7)' },
            { number: 8, name: 'Channel 8 (D8)' }
        ],
        defaultConnection: {
            ipAddress: 'epscctv03.iptime.org',
            port: 8080,
            rtspPort: 8888,
            username: 'admin',
            password: '!yanry4880'
        }
    },

    // 주차장 모니터링 설정
    parkingMonitor: {
        // 갑을명가 카트방식 (6단 × 30대 = 180대)
        vehicleAddressStart: 101,               // P101
        vehicleAddressEnd: 280,                 // P280
        totalSlots: 180,
        cartsCount: 6,                          // 1단~6단 카트
        slotsPerCart: 30,                       // 각 카트당 30대
        // 갑을명가는 차판상태가 별도로 없고 차량번호만 관리
        hasPlateStatus: false,
        // 리프트 위치 정보
        liftPositionStart: 300,                 // P300
        entranceLevel: 301,                     // P301: 승입장
        turnLevel: 302,                         // P302: 턴회전
    
    }
}
export default gapEulMyeongGaConfig;