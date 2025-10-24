// 갑을명가 현장 설정
export const gapEulMyeongGaConfig = {
    // 사이트 기본 정보
    siteInfo: {
        name: "갑을명가",
        unitNumber: "1호기",
        location: "갑을명가 주차타워",
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
                5: { name: "P121.5_언로더비상_후면_슬라이더", description: "언로더비상_후면_슬라이더", category: "1단카트" },
                6: { name: "P121.6_후면_슬라이더_로더정위치", description: "후면_슬라이더_로더정위치", category: "1단카트" },
                7: { name: "P121.7_후면_슬라이더_언로더정위치", description: "후면_슬라이더_언로더정위치", category: "1단카트" },
                8: { name: "P121.8_후면_슬라이더_로더비상", description: "후면_슬라이더_로더비상", category: "1단카트" },
                9: { name: "P121.9_후면_슬라이더_언로더비상", description: "후면_슬라이더_언로더비상", category: "1단카트" },
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

    // PC 제어 명령 주소 (갑을명가 5페이지 구성)
    controlCommands: {
        // 페이지 1: 리프트
        page1: {
            remoteEmergencyStop: { address: 108, bit: 0 }, // P108.0: 원격_비상정지
            remoteManualSelect: { address: 108, bit: 1 },  // P108.1: 원격_수동선택
            remoteCenteringSelect: { address: 108, bit: 2 }, // P108.2: 원격_센터링선택
            remoteLiftUp: { address: 108, bit: 3 },        // P108.3: 원격_상승버튼
            remoteLiftDown: { address: 108, bit: 4 },      // P108.4: 원격_하강버튼
            remoteCenteringAlignStopperUp: { address: 108, bit: 5 }, // P108.5: 원격_센터링정렬/스토퍼상승
            remoteCenteringReleaseStopperDown: { address: 108, bit: 6 }, // P108.6: 원격_센터링해제/스토퍼하강
            remoteHighSpeed: { address: 108, bit: 7 },     // P108.7: 원격_고속버튼
            remoteReset: { address: 108, bit: 8 },         // P108.8: 원격_리셋버튼
            remoteDoorOpen: { address: 108, bit: 9 },      // P108.9: 원격_도어열림
            remoteDoorClose: { address: 108, bit: 10 },     // P108.A: 원격_도어닫힘
            remoteExternalTurnForward: { address: 108, bit: 11 }, // P108.B: 원격_외장턴정
            remoteExternalTurnReverse: { address: 108, bit: 12 }  // P108.C: 원격_외장턴역
        },

        // 페이지 2: 1단카트
        page2: {
            remoteManual1: { address: 128, bit: 0 }, // P128.0: 원격_수동1
            remoteAuto1: { address: 128, bit: 1 }, // P128.1: 원격_자동1
            remoteSliderSelect1: { address: 128, bit: 2 }, // P128.2: 원격_슬라이더선택1
            remoteLiftSideSelect1: { address: 128, bit: 3 }, // P128.3: 원격_리프트측선택1
            remoteSliderFrontSelect1: { address: 128, bit: 4 }, // P128.4: 원격_슬라이더_전면선택1
            remoteSliderRearSelect1: { address: 128, bit: 5 }, // P128.5: 원격_슬라이더_후면선택1
            remoteEndRunButton1: { address: 128, bit: 6 }, // P128.6: 원격_끝번주행_버튼1
            remoteStartRunButton1: { address: 128, bit: 7 }, // P128.7: 원격_시작주행_버튼1
            remoteStorageButtonLoad1: { address: 128, bit: 8 }, // P128.8: 원격_격납_버튼_로드1
            remoteExtractButtonUnload1: { address: 128, bit: 9 }, // P128.9: 원격_추출_버튼_언로드1
            remoteHighSpeedButton1: { address: 128, bit: 10 }, // P128.A: 원격_고속_버튼1
            remoteResetButton1: { address: 128, bit: 11 }, // P128.B: 원격_리셋버튼1
            remoteEmergencyButton1: { address: 128, bit: 12 }, // P128.C: 원격_비상버튼1
            remoteSliderInitialize: { address: 128, bit: 13 } // P128.D: 원격_슬라이더초기화
        },

        // 페이지 3: 2단카트
        page3: {
            remoteManual2: { address: 138, bit: 0 }, // P138.0: 원격_수동2
            remoteAuto2: { address: 138, bit: 1 }, // P138.1: 원격_자동2
            remoteSliderSelect2: { address: 138, bit: 2 }, // P138.2: 원격_슬라이더선택2
            remoteLiftSideSelect2: { address: 138, bit: 3 }, // P138.3: 원격_리프트측선택2
            remoteSliderFrontSelect2: { address: 138, bit: 4 }, // P138.4: 원격_슬라이더_전면선택2
            remoteSliderRearSelect2: { address: 138, bit: 5 }, // P138.5: 원격_슬라이더_후면선택2
            remoteEndRunButton2: { address: 138, bit: 6 }, // P138.6: 원격_끝번주행_버튼2
            remoteStartRunButton2: { address: 138, bit: 7 }, // P138.7: 원격_시작주행_버튼2
            remoteStorageButtonLoad2: { address: 138, bit: 8 }, // P138.8: 원격_격납_버튼_로드2
            remoteExtractButtonUnload2: { address: 138, bit: 9 }, // P138.9: 원격_추출_버튼_언로드2
            remoteHighSpeedButton2: { address: 138, bit: 10 }, // P138.A: 원격_고속_버튼2
            remoteResetButton2: { address: 138, bit: 11 }, // P138.B: 원격_리셋버튼2
            remoteEmergencyButton2: { address: 138, bit: 12 }, // P138.C: 원격_비상버튼2
            remoteSliderInitialize2: { address: 138, bit: 13 } // P138.D: 원격_슬라이더초기화
        },

        // 페이지 4: 4단카트
        page4: {
            remoteManual4: { address: 148, bit: 0 }, // P148.0: 원격_수동4
            remoteAuto4: { address: 148, bit: 1 }, // P148.1: 원격_자동4
            remoteSliderSelect4: { address: 148, bit: 2 }, // P148.2: 원격_슬라이더선택4
            remoteLiftSideSelect4: { address: 148, bit: 3 }, // P148.3: 원격_리프트측선택4
            remoteSliderFrontSelect4: { address: 148, bit: 4 }, // P148.4: 원격_슬라이더_전면선택4
            remoteSliderRearSelect4: { address: 148, bit: 5 }, // P148.5: 원격_슬라이더_후면선택4
            remoteEndRunButton4: { address: 148, bit: 6 }, // P148.6: 원격_끝번주행_버튼4
            remoteStartRunButton4: { address: 148, bit: 7 }, // P148.7: 원격_시작주행_버튼4
            remoteStorageButtonLoad4: { address: 148, bit: 8 }, // P148.8: 원격_격납_버튼_로드4
            remoteExtractButtonUnload4: { address: 148, bit: 9 }, // P148.9: 원격_추출_버튼_언로드4
            remoteHighSpeedButton4: { address: 148, bit: 10 }, // P148.A: 원격_고속_버튼4
            remoteResetButton4: { address: 148, bit: 11 }, // P148.B: 원격_리셋버튼4
            remoteEmergencyButton4: { address: 148, bit: 12 }, // P148.C: 원격_비상버튼4
            remoteSliderInitialize4: { address: 148, bit: 13 } // P148.D: 원격_슬라이더초기화
        },

        // 페이지 5: 5단카트
        page5: {
            remoteManual5: { address: 158, bit: 0 }, // P158.0: 원격_수동5
            remoteAuto5: { address: 158, bit: 1 }, // P158.1: 원격_자동5
            remoteSliderSelect5: { address: 158, bit: 2 }, // P158.2: 원격_슬라이더선택5
            remoteLiftSideSelect5: { address: 158, bit: 3 }, // P158.3: 원격_리프트측선택5
            remoteSliderFrontSelect5: { address: 158, bit: 4 }, // P158.4: 원격_슬라이더_전면선택5
            remoteSliderRearSelect5: { address: 158, bit: 5 }, // P158.5: 원격_슬라이더_후면선택5
            remoteEndRunButton5: { address: 158, bit: 6 }, // P158.6: 원격_끝번주행_버튼5
            remoteStartRunButton5: { address: 158, bit: 7 }, // P158.7: 원격_시작주행_버튼5
            remoteStorageButtonLoad5: { address: 158, bit: 8 }, // P158.8: 원격_격납_버튼_로드5
            remoteExtractButtonUnload5: { address: 158, bit: 9 }, // P158.9: 원격_추출_버튼_언로드5
            remoteHighSpeedButton5: { address: 158, bit: 10 }, // P158.A: 원격_고속_버튼5
            remoteResetButton5: { address: 158, bit: 11 }, // P158.B: 원격_리셋버튼5
            remoteEmergencyButton5: { address: 158, bit: 12 }, // P158.C: 원격_비상버튼5
            remoteSliderInitialize5: { address: 158, bit: 13 } // P158.D: 원격_슬라이더초기화
        }
    },

    // 수동 제어 탭 구성 (갑을명가 5페이지)
    manualControlTabs: {
        page1: {
            name: "기본 제어",
            commands: {
                liftUp: "liftUp",
                liftDown: "liftDown",
                moveLeft: "moveLeft",
                moveRight: "moveRight",
                turnLeft: "turnLeft",
                turnRight: "turnRight",
                doorOpen: "doorOpen",
                doorClose: "doorClose"
            }
        },
        page2: {
            name: "센터링/스톱퍼",
            commands: {
                centeringAlign: "centeringAlign",
                centeringRelease: "centeringRelease",
                stopperUp: "stopperUp",
                stopperDown: "stopperDown",
                externalTurnForward: "externalTurnForward",
                externalTurnReverse: "externalTurnReverse",
                highSpeed: "highSpeed",
                normalSpeed: "normalSpeed"
            }
        },
        page3: {
            name: "시스템 제어",
            commands: {
                errorReset: "errorReset",
                remoteControl: "remoteControl",
                homeReturn: "homeReturn",
                manualMode: "manualMode",
                autoMode: "autoMode",
                emergencyStop: "emergencyStop",
                systemReset: "systemReset",
                maintenanceMode: "maintenanceMode"
            }
        },
        page4: {
            name: "신호/표시",
            commands: {
                guideLight1: "guideLight1",
                guideLight2: "guideLight2",
                guideLight4: "guideLight4",
                guideLight8: "guideLight8",
                redSignal: "redSignal",
                greenSignal: "greenSignal",
                buzzerNormal: "buzzerNormal",
                buzzerError: "buzzerError"
            }
        },
        page5: {
            name: "모터 제어",
            commands: {
                liftMotorMC: "liftMotorMC",
                liftMotorBK: "liftMotorBK",
                doorMotorMC: "doorMotorMC",
                centeringLockMC: "centeringLockMC",
                centeringOpenMC: "centeringOpenMC",
                stopperUpMC: "stopperUpMC",
                stopperDownMC: "stopperDownMC",
                externalTurnForwardMC: "externalTurnForwardMC",
                externalTurnReverseMC: "externalTurnReverseMC"
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
            rtspPort: 5000,
            username: 'admin',
            password: '!yanry4880'
        }
    },
}
export default gapEulMyeongGaConfig;