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
    isShiftEnding: false,

    // Tick time
    tick: () => set((state) => {
        if (state.gameOver || state.dayComplete) return state;

        const newTime = state.time + 1;
        let nextState = { time: newTime };

        if (state.isResting) {
            const staminaBonus = state.isCollapsed ? 5 : 4;
            nextState.stamina = Math.min(100, state.stamina + staminaBonus);
            nextState.mental = Math.min(100, state.mental + 1.2);
        } else {
            // Natural mental drain even when not resting, because of hospital stress
            nextState.mental = Math.max(0, state.mental - 0.2);
        }

        if (state.isCollapsed && (nextState.stamina ?? state.stamina) >= 40) {
            nextState.isCollapsed = false;
        }

        let rep = state.reputation;
        if (state.duties.length >= 4 && newTime % 4 === 0) {
            rep -= 1.5;
            nextState.mental = Math.max(0, (nextState.mental ?? state.mental) - 1.0); // More stress
        }
        if (state.duties.length > 0 && (newTime - state.duties[0].createdAt) > 45 && newTime % 8 === 0) {
            rep -= 1.2;
            nextState.mental = Math.max(0, (nextState.mental ?? state.mental) - 0.8);
        }

        if (rep !== state.reputation) {
            nextState.reputation = Math.max(0, rep);
        }

        if (newTime >= START_TIME + GAME_DURATION_MINUTES && !state.isShiftEnding) {
            nextState.isShiftEnding = true;
        }

        return nextState;
    }),

    addDuty: (duty) => set((state) => ({
        duties: [...state.duties, {
            ...duty,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            createdAt: state.time
        }],
        mental: Math.max(0, state.mental - 2.5) // Phone call call/new duty creates stress
    })),

    completeDuty: (id) => set((state) => ({
        duties: state.duties.filter(d => d.id !== id),
        completedDutiesCount: state.completedDutiesCount + 1,
        mental: Math.min(100, state.mental + 3) // Satisfaction after finishing work
    })),

    modifyStamina: (amount) => set((state) => {
        const stamina = Math.max(0, Math.min(100, state.stamina + amount));
        if (stamina === 0 && !state.gameOver) {
            return { stamina, isResting: true, isCollapsed: true };
        }
        return { stamina };
    }),

    modifyMental: (amount, reason = '') => set((state) => {
        const mental = Math.max(0, Math.min(100, state.mental + amount));
        return { mental };
    }),

    modifyReputation: (amount) => set((state) => {
        const reputation = Math.max(0, Math.min(100, state.reputation + amount));
        // Losing rep also hurts mental (stress from manager/nurse)
        let mentalUpdate = {};
        if (amount < 0) {
            mentalUpdate.mental = Math.max(0, state.mental + (amount * 1.2));
        }
        return { reputation, ...mentalUpdate };
    }),

    finishDay: (options = { force: false }) => set((state) => {
        let nextRep = state.reputation;
        if (!options.force && state.duties.length > 0) {
            // Deduct reputation for each unfinished duty
            nextRep = Math.max(0, state.reputation - (state.duties.length * 15));
        }
        return { dayComplete: true, isShiftEnding: false, reputation: nextRep };
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
