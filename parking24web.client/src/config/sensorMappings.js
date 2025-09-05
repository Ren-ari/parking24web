
// 토로스 현장


export const torosSensorMapping = [

    // 리프트/후크 관련 (위치센서)
    { index: 20, name: '리프트레벨1', bit: 0, description: '리프트 레벨1', category: '위치센서' },
    { index: 21, name: '리프트레벨2', bit: 0, description: '리프트 레벨2', category: '위치센서' },
    { index: 22, name: '후크중앙확인', bit: 0, description: '후크중앙확인', category: '위치센서' },
    { index: 23, name: '와이어절단확인', bit: 0, description: '와이어 절단확인', category: '안전센서' },
    { index: 24, name: '홀수후크감지', bit: 0, description: '홀수 후크 감지', category: '위치센서' },
    { index: 25, name: '짝수후크감지', bit: 0, description: '짝수 후크 감지', category: '위치센서' },

    // 피트/턴 관련 (위치센서)
    { index: 26, name: '좌측피트확인', bit: 0, description: '좌측 피트확인', category: '위치센서' },
    { index: 27, name: '우측피트확인', bit: 0, description: '우측 피트확인', category: '위치센서' },
    { index: 28, name: '턴0도확인정지', bit: 0, description: '턴 0도 확인정지', category: '위치센서' },
    { index: 29, name: '턴180도확인정지', bit: 0, description: '턴 180도 확인정지', category: '위치센서' },
    { index: 30, name: '리프트홈확인', bit: 0, description: '리프트 홈 확인', category: '위치센서' },
    { index: 31, name: '턴상승확인', bit: 0, description: '턴 상승확인', category: '위치센서' },
    { index: 32, name: '턴하강확인', bit: 0, description: '턴 하강확인', category: '위치센서' },

    // 록킹 관련 (상태센서)
    { index: 33, name: '홀수측록킹잠김확인', bit: 0, description: '홀수측 록킹잠김확인', category: '상태센서' },
    { index: 34, name: '홀수측록킹풀림확인', bit: 0, description: '홀수측 록킹풀림확인', category: '상태센서' },
    { index: 35, name: '짝수측록킹잠김확인', bit: 0, description: '짝수측 록킹잠김확인', category: '상태센서' },
    { index: 36, name: '짝수측록킹풀림확인', bit: 0, description: '짝수측 록킹풀림확인', category: '상태센서' },

    // 리프트 동작 관련 (안전센서)
    { index: 37, name: '리프트하강감속확인', bit: 0, description: '리프트 하강감속확인', category: '안전센서' },
    { index: 38, name: '리프트하강비상확인', bit: 0, description: '리프트 하강비상확인', category: '안전센서' },
    { index: 51, name: '리프트상승비상확인', bit: 0, description: '리프트 상승비상확인', category: '안전센서' },
    { index: 52, name: '리프트상승감속확인', bit: 0, description: '리프트 상승감속확인', category: '안전센서' },

    // 도어 관련 (상태센서)
    { index: 39, name: '도어열림확인', bit: 0, description: '도어열림확인', category: '상태센서' },
    { index: 40, name: '도어닫힘확인', bit: 0, description: '도어닫힘확인', category: '상태센서' },
    { index: 41, name: '도어잠확인', bit: 0, description: '도어잠확인', category: '상태센서' },
    { index: 44, name: '좌도어확인', bit: 0, description: '좌도어확인', category: '상태센서' },
    { index: 45, name: '우도어확인', bit: 0, description: '우도어확인', category: '상태센서' },
    { index: 53, name: '도어내확인', bit: 0, description: '도어내확인', category: '상태센서' },

    // 차량 감지/범퍼 관련 (안전센서)
    { index: 42, name: '좌측동작감지확인1', bit: 0, description: '좌측동작감지확인1', category: '안전센서' },
    { index: 43, name: '우측동작감지확인1', bit: 0, description: '우측동작감지확인1', category: '안전센서' },
    { index: 46, name: '앞범퍼확인', bit: 0, description: '앞범퍼확인', category: '안전센서' },
    { index: 47, name: '차량정위치', bit: 0, description: '차량정위치', category: '위치센서' },
    { index: 48, name: 'RV높이확인', bit: 0, description: 'RV높이확인', category: '위치센서' },
    { index: 49, name: '승용높이확인', bit: 0, description: '승용높이확인', category: '위치센서' },
    { index: 50, name: '뒷범퍼확인', bit: 0, description: '뒷범퍼확인', category: '안전센서' },

    // 상태 표시 센서 (시스템)
    { index: 15, name: '주차기운전상태수동', bit: 0, description: '주차기 운전상태 수동일때', category: '시스템' },
    { index: 16, name: '에러발생', bit: 0, description: '에러발생', category: '시스템' },
    { index: 15, name: '주차기운전상태자동', bit: 0, description: '주차기 운전상태 자동일때', category: '시스템', inverted: true },
    { index: 16, name: '대기중', bit: 0, description: '대기중', category: '시스템', inverted: true },

    // 리프트 출력 상태 (출력)
    { index: 70, name: '리프트인버터정회전', bit: 0, description: '리프트 인버터 정회전', category: '출력' },
    { index: 70, name: '리프트인버터역회전', bit: 1, description: '리프트 인버터 역회전', category: '출력' },
    { index: 70, name: '리프트인버터리셋', bit: 7, description: '리프트 인버터 리셋', category: '출력' },
    { index: 70, name: '리프트인버터SP1', bit: 2, description: '리프트 인버터 SP1', category: '출력' },
    { index: 70, name: '리프트인버터SP2', bit: 3, description: '리프트 인버터 SP2', category: '출력' },
    { index: 70, name: '리프트인버터SP3', bit: 4, description: '리프트 인버터 SP3', category: '출력' },
    { index: 70, name: '리프트인버터비상라인', bit: 6, description: '리프트 인버터 비상라인', category: '출력' },

    { index: 69, name: '리프트인버터리프트BK', bit: 10, description: '리프트 인버터 리프트BK', category: '출력' },
    { index: 69, name: '유도등전진', bit: 4, description: '유도등 전진', category: '출력' },
    { index: 69, name: '유도등정지', bit: 5, description: '유도등 정지', category: '출력' },
    { index: 69, name: '유도등후진', bit: 6, description: '유도등 후진', category: '출력' },

    // 기타 센서들
    { index: 61, name: '와이어절단', bit: 11, description: '와이어 절단', category: '안전센서' },
    { index: 67, name: '상승비상', bit: 4, description: '상승비상', category: '안전센서' },
    { index: 67, name: '상승감속', bit: 3, description: '상승감속', category: '안전센서' },
    { index: 62, name: '좌측피트', bit: 13, description: '좌측피트', category: '위치센서' },
    { index: 62, name: '우측피트', bit: 14, description: '우측피트', category: '위치센서' },
    { index: 65, name: '레벨상', bit: 13, description: '레벨상', category: '위치센서' },
    { index: 60, name: '레벨하', bit: 12, description: '레벨하', category: '위치센서' },
    { index: 62, name: '홈확인', bit: 15, description: '홈 확인', category: '위치센서' },
    { index: 67, name: '하강감속', bit: 1, description: '하강감속', category: '안전센서' },
    { index: 67, name: '하강비상', bit: 2, description: '하강비상', category: '안전센서' },

    // 횡행 락킹 출력
    { index: 69, name: '정회전MC', bit: 13, description: '정회전 MC', category: '출력' },
    { index: 71, name: '우회전MC', bit: 1, description: '우회전 MC', category: '출력' },
    { index: 67, name: '좌측락킹열림확인', bit: 9, description: '좌측락킹 열림확인', category: '상태센서' },
    { index: 67, name: '우측락킹열림확인', bit: 12, description: '우측락킹 열림확인', category: '상태센서' },

    // 도어 센서
    { index: 69, name: '도어모터정회전MC', bit: 8, description: '도어모터 정회전 MC', category: '출력' },
    { index: 69, name: '도어모터우회전MC', bit: 9, description: '도어모터 우회전 MC', category: '출력' },
    { index: 69, name: '적색신호등', bit: 2, description: '적색신호등', category: '출력' },
    { index: 69, name: '녹색신호등', bit: 3, description: '녹색신호등', category: '출력' },
    { index: 63, name: '도어열림확인센서', bit: 8, description: '도어 열림확인', category: '상태센서' },
    { index: 63, name: '도어닫힘확인센서', bit: 9, description: '도어 닫힘확인', category: '상태센서' },

    // 턴 테이블 인버터
    { index: 71, name: '턴테이블인버터정회전', bit: 0, description: '턴테이블 인버터 정회전', category: '출력' },
    { index: 71, name: '턴테이블인버터역회전', bit: 1, description: '턴테이블 인버터 역회전', category: '출력' },
    { index: 71, name: '턴테이블인버터리셋', bit: 7, description: '턴테이블 인버터 리셋', category: '출력' },
    { index: 71, name: '턴테이블인버터SP1', bit: 2, description: '턴테이블 인버터 SP1', category: '출력' },
    { index: 71, name: '턴테이블인버터SP2', bit: 3, description: '턴테이블 인버터 SP2', category: '출력' },
    { index: 71, name: '턴테이블인버터SP3', bit: 4, description: '턴테이블 인버터 SP3', category: '출력' },

    { index: 68, name: '턴모터', bit: 11, description: '턴 모터', category: '출력' },
    { index: 68, name: '턴모터BK', bit: 12, description: '턴 모터 BK', category: '출력' },
    { index: 68, name: '턴리프팅상승', bit: 6, description: '턴리프팅 상승', category: '출력' },
    { index: 68, name: '턴리프팅하강', bit: 7, description: '턴리프팅 하강', category: '출력' },

    { index: 64, name: '턴좌회전정지', bit: 3, description: '턴 좌회전정지', category: '위치센서' },
    { index: 64, name: '턴우회전정지', bit: 1, description: '턴 우회전정지', category: '위치센서' },
    { index: 66, name: '턴테이블상승정지', bit: 14, description: '턴테이블 상승정지', category: '위치센서' },
    { index: 66, name: '턴테이블하강정지', bit: 15, description: '턴테이블 하강정지', category: '위치센서' },

    // 최종 센서들
    { index: 62, name: '짝수후크확인', bit: 12, description: '짝수후크확인', category: '위치센서' },
    { index: 62, name: '홀수후크확인', bit: 10, description: '홀수후크확인', category: '위치센서' },
    { index: 62, name: '중앙후크확인', bit: 11, description: '중앙후크확인', category: '위치센서' },
    { index: 63, name: '좌측차판확인', bit: 14, description: '좌측차판확인', category: '위치센서' },
    { index: 63, name: '우측차판확인', bit: 13, description: '우측차판확인', category: '위치센서' }

];