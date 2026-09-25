from django.db import migrations

def create_triggers(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('''
            CREATE OR REPLACE FUNCTION prevent_audit_modification()
            RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'Cryptographic audit ledger is immutable';
            END;
            $$ LANGUAGE plpgsql;
        ''')
        schema_editor.execute('''
            CREATE TRIGGER trg_prevent_audit_update
            BEFORE UPDATE ON audit_auditevent
            FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
        ''')
        schema_editor.execute('''
            CREATE TRIGGER trg_prevent_audit_delete
            BEFORE DELETE ON audit_auditevent
            FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
        ''')
    elif schema_editor.connection.vendor == 'sqlite':
        schema_editor.execute('''
            CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_update
            BEFORE UPDATE ON audit_auditevent
            BEGIN
                SELECT RAISE(ABORT, 'Cryptographic audit ledger is immutable');
            END;
        ''')
        schema_editor.execute('''
            CREATE TRIGGER IF NOT EXISTS trg_prevent_audit_delete
            BEFORE DELETE ON audit_auditevent
            BEGIN
                SELECT RAISE(ABORT, 'Cryptographic audit ledger is immutable');
            END;
        ''')

def drop_triggers(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute('DROP TRIGGER IF EXISTS trg_prevent_audit_update ON audit_auditevent;')
        schema_editor.execute('DROP TRIGGER IF EXISTS trg_prevent_audit_delete ON audit_auditevent;')
        schema_editor.execute('DROP FUNCTION IF EXISTS prevent_audit_modification();')
    elif schema_editor.connection.vendor == 'sqlite':
        schema_editor.execute('DROP TRIGGER IF EXISTS trg_prevent_audit_update;')
        schema_editor.execute('DROP TRIGGER IF EXISTS trg_prevent_audit_delete;')


class Migration(migrations.Migration):

    dependencies = [
        ('audit', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_triggers, drop_triggers),
    ]
