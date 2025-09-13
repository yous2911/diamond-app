import apiClient from './api';

export interface LeaderboardEntry {
    id: string;
    name: string;
    xp: number;
    rank: number;
}

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    // Assuming a /leaderboard endpoint that returns an array of ranked users
    const response = await apiClient.get('/leaderboard');
    return response.data;
};
