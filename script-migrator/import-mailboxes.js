require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Config from environment
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function importMailboxes() {
  try {
    const workspaces = JSON.parse(fs.readFileSync(process.env.JSON_FILE_PATH));
    
    for (const [workspaceName, { workspace_id, mailboxes }] of Object.entries(workspaces)) {
      console.log(`Importing ${mailboxes.length} mailboxes for ${workspaceName}`);
      
      // Batch insert (50 at a time)
      for (let i = 0; i < mailboxes.length; i += 50) {
        const batch = mailboxes.slice(i, i + 50).map(m => ({
          workspace_id,
          email: m.email,
          limit: m.limit,
          tags: m.tags
        }));
        
        const { error } = await supabase
          .from(process.env.TABLE_NAME)
          .insert(batch);
        
        if (error) throw error;
        console.log(`Inserted batch ${Math.floor(i/50) + 1}`);
      }
    }
    
    console.log('All mailboxes imported successfully');
  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

importMailboxes();