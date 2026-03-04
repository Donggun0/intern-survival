import { create } from 'zustand';

// Initial game parameters
export const GAME_DURATION_MINUTES = 10 * 60; // 8:00 to 18:00
export const START_TIME = 8 * 60;

const useGameStore = create((set, get) => ({
    time: START_TIME,
    stamina: 100,
    mental: 100,
    reputation: 100,

    dayComplete: false,
    gameOver: false,
    gameOverReason: null,

    duties: [],
    activeMiniGame: null,
    activeEvent: null,

    completedDutiesCount: 0,
    isResting: false,
    isCollapsed: false,

    // Tick time (1 min = 1 tick, or as needed by components)
    tick: () => set((state) => {
        if (state.gameOver || state.dayComplete) return state;

        // Time advances
        const newTime = state.time + 1;
        let nextState = { time: newTime };

        // If resting, recover stamina and mental
        if (state.isResting) {
            // Explicitly calculate new values to ensure both are updated even if one is at max
            const staminaBonus = state.isCollapsed ? 4 : 3; // Recover slightly faster when collapsed
            nextState.stamina = Math.min(100, state.stamina + staminaBonus);
            nextState.mental = Math.min(100, state.mental + 1);
        }

        // Recover from collapse
        if (state.isCollapsed && (nextState.stamina ?? state.stamina) >= 30) {
            nextState.isCollapsed = false;
        }

        // Apply inaction penalties
        let rep = state.reputation;
        if (state.duties.length >= 4 && newTime % 5 === 0) {
            rep -= 1; // 1 rep loss every 5 mins if 4+ duties
        }
        if (state.duties.length > 0 && (newTime - state.duties[0].createdAt) > 60 && newTime % 10 === 0) {
            rep -= 1; // 1 rep loss every 10 mins if oldest duty is > 60 mins old
        }

        if (rep !== state.reputation) {
            nextState.reputation = Math.max(0, rep);
        }

        if (newTime >= START_TIME + GAME_DURATION_MINUTES) {
            nextState.dayComplete = true;
        }

        return nextState;
    }),

    // Add a duty to the queue
    addDuty: (duty) => set((state) => ({
        duties: [...state.duties, {
            ...duty,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            createdAt: state.time
        }]
    })),

    // Completing a duty
    completeDuty: (id) => set((state) => ({
        duties: state.duties.filter(d => d.id !== id),
        completedDutiesCount: state.completedDutiesCount + 1
    })),

    // Modifying stats
    modifyStamina: (amount) => set((state) => {
        const stamina = Math.max(0, Math.min(100, state.stamina + amount));
        if (stamina === 0 && !state.gameOver) {
            // Forced rest triggered and collapsed
            return { stamina, isResting: true, isCollapsed: true };
        }
        return { stamina };
    }),

    modifyMental: (amount, reason = '') => set((state) => {
        const mental = Math.max(0, Math.min(100, state.mental + amount));
        if (mental === 0 && !state.gameOver) {
            // Trigger game over on mental breakdown
            return { mental };
        }
        return { mental };
    }),

    modifyReputation: (amount) => set((state) => {
        const reputation = Math.max(0, Math.min(100, state.reputation + amount));
        return { reputation };
    }),

    // Starting & Ending a MiniGame
    startMiniGame: (miniGameData) => set((state) => {
        if (state.isCollapsed) {
            alert("탈진 상태입니다! 체력이 30 이상 회복될 때까지 아무런 업무도 수행할 수 없습니다.");
            return state;
        }
        return { activeMiniGame: miniGameData, isResting: false };
    }),
    endMiniGame: () => set({ activeMiniGame: null }),

    // Events (Professor round, CPR, Phone calls)
    triggerEvent: (eventData) => set({ activeEvent: eventData }),
    clearEvent: () => set({ activeEvent: null }),

    // Toggling Rest Mode
    toggleRest: () => set((state) => {
        if (state.isCollapsed) {
            alert("탈진 상태에서는 강제로 휴식을 취해야 합니다!");
            return state;
        }
        return { isResting: !state.isResting };
    }),

    // SOS feature
    useSos: () => {
        set((state) => {
            const success = Math.random() > 0.4; // 60% chance
            const reputationLoss = -15;

            return {
                reputation: Math.max(0, state.reputation + reputationLoss),
                activeEvent: {
                    type: 'SOS_RESULT',
                    success: success,
                    message: success
                        ? "동기: '아 씨 나도 바쁜데... 알았어 내가 하나 할게.'"
                        : "동기: '야 나 지금 CPR방이야 미쳐 끊어!!'"
                }
            }
        });
    }

}));

export default useGameStore;
