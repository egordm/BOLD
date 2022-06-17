from channels.layers import get_channel_layer
from channels_postgres.core import PostgresChannelLayer
from django.db import connection


def _retrieve_group_channels(cur, group_key):
    retrieve_channels_sql = (
        'SELECT DISTINCT group_key,channel '
        'FROM channels_postgres_groupchannel WHERE group_key=%s;'
    )

    cur.execute(retrieve_channels_sql, (group_key,))

    channels = []
    for row in cur:
        channels.append(row[1])

    return channels


def send_to_channel_sync(cur, group_key, message, expire, channel=None):
    if channel is None:
        channels = _retrieve_group_channels(cur, group_key)
    else:
        channels = [channel]

    values_str = b','.join(
        cur.mogrify(
            "(%s, %s, (NOW() + INTERVAL '%s seconds'))", (channel, message, expire)
        ) for channel in channels
    )
    insert_message_sql = (
        b'INSERT INTO channels_postgres_message (channel, message, expire) VALUES ' + values_str
    )
    cur.execute(insert_message_sql)


def send_to_group_sync(group, message):
    channel_layer: PostgresChannelLayer = get_channel_layer()

    assert channel_layer.valid_group_name(group), "Group name not valid"
    group_key = channel_layer._group_key(group)
    message = channel_layer.serialize(message)
    cur = connection.cursor()

    send_to_channel_sync(
        cur, group_key, message, channel_layer.expiry
    )
