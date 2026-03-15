// supabase/functions/_shared/push.ts
export async function sendPushNotification(
    supabaseClient: any,
    userIds: string[],
    title: string,
    body: string,
    dataPayload: Record<string, string>
): Promise<void> {
    if (userIds.length === 0) return;

    try {
        const { data: tokensData, error } = await supabaseClient
            .from('device_tokens')
            .select('token')
            .in('user_id', userIds);

        if (error || !tokensData || tokensData.length === 0) return;

        const tokens = tokensData.map((t: any) => t.token);
        const sendPushUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`;

        fetch(sendPushUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
                tokens,
                title,
                body,
                data: dataPayload,
            }),
        }).catch((e) => console.error('Error invoking send-push:', e));
    } catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
}
