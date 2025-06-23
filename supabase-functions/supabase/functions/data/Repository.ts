import { TableName } from "./TableName.ts";


export class Repository<T extends { [key: string]: any }> {
  constructor(private readonly tableName: TableName, 
    private readonly supabase: any) {
  }

  async findAll(filter: Partial<T> = {}): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .match(filter);

    if (error) throw new Error(`findAll failed: ${error.message}`);
    return data as T[];
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .match(filter)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' = no rows found
      throw new Error(`findOne failed: ${error.message}`);
    }

    return data as T | null;
  }

  async upsert(data: T | T[], onConflict: string | string[] = 'id'): Promise<T[]> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .upsert(data, { onConflict })
      .select();
  
    if (error) {
      throw new Error(`upsert failed: ${error.message}`);
    }
  
    return result as T[];
  }

  async delete(filter: Partial<T>): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .match(filter);

    if (error) throw new Error(`delete failed: ${error.message}`);
  }

  async flagNotFoundMailboxes(workspaceId: string, emails: string[]) {
    const { error } = await this.supabase
      .from('mailboxes')
      .update({ missing_in_instantly: true })
      .match({ workspace_id: workspaceId })
      .not('email', 'in', `(${emails.map(email => `'${email}'`).join(',')})`);
  
    if (error) {
      console.error('Failed to update missing_in_instantly flag:', error);
      throw error;
    }
  }
}
