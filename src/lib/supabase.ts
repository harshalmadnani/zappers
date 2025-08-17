import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import type { User, Agent } from '../types/database';

// Re-export types for convenience
export type { User, Agent };

// Create Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// User operations
export const userService = {
  async createUser(wallet: string) {
    const { data, error } = await supabase
      .from('users')
      .insert([{ wallet }])
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  },

  async getUserByWallet(wallet: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet', wallet)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as User | null;
  },

  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  },

  async upsertUser(wallet: string) {
    // First try to find existing user by wallet
    let existingUser = await this.getUserByWallet(wallet);

    if (existingUser) {
      // Update existing user
      return await this.updateUser(existingUser.id, { wallet });
    } else {
      // Create new user
      return await this.createUser(wallet);
    }
  }
};

// Agent operations
export const agentService = {
  async getAllAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Agent[];
  },

  async getAgentsByUserWallet(userWallet: string) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_wallet', userWallet)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Agent[];
  },

  async createAgent(agent: Omit<Agent, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single();
    
    if (error) throw error;
    return data as Agent;
  },

  async updateAgent(id: number, updates: Partial<Omit<Agent, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Agent;
  },

  async deleteAgent(id: number) {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
