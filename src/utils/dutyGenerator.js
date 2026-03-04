const FIRST_NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const LAST_NAMES = ["민준", "서연", "도윤", "서윤", "시우", "지우", "민재", "하은", "주원", "지민", "철수", "영희"];

const getRandomPatientName = () => {
    return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
};

const getRandomLocation = () => {
    const wards = ["51병동", "52병동", "61병동", "72병동", "응급실"];
    const room = Math.floor(Math.random() * 20) + 1;
    return `${wards[Math.floor(Math.random() * wards.length)]} ${room}호`;
};

// Types of duties
export const DUTY_TYPES = {
    BLOOD_DRAW: { id: 'BLOOD_DRAW', name: '채혈 및 혈액배양검사', type: 'minigame', staminaCost: 10 },
    ABGA: { id: 'ABGA', name: '동맥혈가스검사 (ABGA)', type: 'minigame', staminaCost: 15 },
    DRESSING: { id: 'DRESSING', name: '상처 소독 (Dressing)', type: 'minigame', staminaCost: 10 },
    CONSENT: { id: 'CONSENT', name: '동의서 받기', type: 'minigame', staminaCost: 5 },
    CT_KEEP: { id: 'CT_KEEP', name: 'CT 킵', type: 'wait', staminaCost: 20 },
    EMR_ORDER: { id: 'EMR_ORDER', name: 'EMR 오더 넣기', type: 'minigame', staminaCost: 5 },
    FOLEY_CATHETER: { id: 'FOLEY_CATHETER', name: '소변줄(Foley) 삽입', type: 'minigame', staminaCost: 15 },
    CPR: { id: 'CPR', name: '심폐소생술 (CPR)', type: 'minigame', staminaCost: 30 },
};

// Types of events wrapper calling the duty
export const EVENT_TYPES = {
    CALL: 'CALL',
    PROFESSOR_ROUND: 'PROFESSOR_ROUND',
    CPR: 'CPR',
    COWORKER_REQUEST: 'COWORKER_REQUEST'
};

export const generateDuty = (typeId = null) => {
    let selectedType;
    if (typeId) {
        selectedType = DUTY_TYPES[typeId];
    } else {
        // Weighted random to ensure Dressing spawns more often
        const rand = Math.random();
        if (rand < 0.20) selectedType = DUTY_TYPES.DRESSING;
        else if (rand < 0.35) selectedType = DUTY_TYPES.BLOOD_DRAW;
        else if (rand < 0.50) selectedType = DUTY_TYPES.ABGA;
        else if (rand < 0.65) selectedType = DUTY_TYPES.FOLEY_CATHETER;
        else if (rand < 0.80) selectedType = DUTY_TYPES.CONSENT;
        else if (rand < 0.90) selectedType = DUTY_TYPES.CT_KEEP;
        else selectedType = DUTY_TYPES.EMR_ORDER;
    }

    const patient = {
        name: getRandomPatientName(),
        location: getRandomLocation(),
        idNumber: Math.floor(10000000 + Math.random() * 90000000).toString()
    };

    return {
        type: selectedType,
        patient,
        isUrgent: Math.random() > 0.8, // 20% chance to be urgent
        message: `선생님, ${patient.location} ${patient.name} 환자 ${selectedType.name} 해주세요.`
    };
};

export const generatePhoneCallEvent = (duty) => {
    const callers = ["간호사", "전공의 선생님", "병동 수간호사"];
    const caller = callers[Math.floor(Math.random() * callers.length)];

    // Create an annoying message
    const urgentMessages = [
        `빨리 안 오고 뭐하세요!! ${duty.patient.name} ${duty.type.name} 급해요!`,
        `선생님!! 보호자분 화나셨어요 언제 오세요?`,
        `지금 당장 안 오시면 노티합니다.`
    ];

    const normalMessages = [
        `선생님, ${duty.patient.name} 환자 ${duty.type.name} 좀 부탁드릴게요~`,
        `언제쯤 오실 수 있나요? ${duty.type.name} 오더 났어요.`,
        `아까 말씀드린 ${duty.type.name} 잊지 않으셨죠?`
    ];

    const message = duty.isUrgent
        ? urgentMessages[Math.floor(Math.random() * urgentMessages.length)]
        : normalMessages[Math.floor(Math.random() * normalMessages.length)];

    return {
        eventType: EVENT_TYPES.CALL,
        caller,
        message,
        dutyObj: duty,
    };
};

export const generateProfessorRound = () => {
    const questions = [
        { q: "자네, 이 환자 K 수치가 높은데 심전도 소견이 뭔가?", options: ["Peaked T wave", "ST depression", "U wave"], correct: 0 },
        { q: "DKA 환자 치료에서 가장 먼저 해야 할 것은?", options: ["Insulin 투여", "Normal Saline 수액 투여", "Bicarbonate 투여"], correct: 1 },
        { q: "급성 심근경색(STEMI) 환자의 초기 처치로 틀린 것은?", options: ["Aspirin", "Nitroglycerin", "Epinephrine"], correct: 2 },
    ];

    return {
        eventType: EVENT_TYPES.PROFESSOR_ROUND,
        caller: '교수님',
        data: questions[Math.floor(Math.random() * questions.length)],
    };
};

export const generateCPREvent = () => {
    return {
        eventType: EVENT_TYPES.CPR,
        caller: 'EMERGENCY',
        message: "코드 블루! 코드 블루! 응급실 심정지 발생!!",
    };
};

export const generateCoworkerRequestEvent = () => {
    const duty = generateDuty(); // A random duty the coworker is passing on
    const messages = [
        `야 나 지금 CPR방이라 못 가는데, ${duty.patient.location} ${duty.patient.name} ${duty.type.name} 좀 대신 해줄래? ㅠㅠ`,
        `동기야 미안한데 나 진짜 죽을 것 같아... ${duty.patient.name} ${duty.type.name} 하나만 부탁해도 될까? 밥 살게!`,
        `동기쌤! 지금 처치실이 난장판이라서 그런데 ${duty.patient.name} ${duty.type.name} 좀 도와주라 제발...`
    ];

    return {
        eventType: EVENT_TYPES.COWORKER_REQUEST,
        caller: '눈물 젖은 동기',
        message: messages[Math.floor(Math.random() * messages.length)],
        dutyObj: duty,
    };
};
