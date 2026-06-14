import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ROLE_COLORS } from "@/constants/roles";
import { useAppColors } from "@/hooks/use-app-colors";
import { timeAgo } from "@/utils/format-date";
import type { MessageResponse } from "@/types/messages";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  messages: MessageResponse[];
  loading: boolean;
  connected: boolean;
  sending: boolean;
  dbUserId: string | undefined;
  onSend: (text: string) => Promise<void>;
};

export function IncidentChatTab({ messages, loading, connected, sending, dbUserId, onSend }: Props) {
  const { colors } = useAppColors();
  const [inputText, setInputText] = useState("");
  const listRef = useRef<FlatList<MessageResponse>>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !connected || sending) return;
    const text = inputText;
    setInputText("");
    await onSend(text);
  };

  const s = StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
    emptyText: { fontSize: 15, fontWeight: "700", color: colors.text, opacity: 0.4 },
    emptySubtext: { fontSize: 13, color: colors.text, opacity: 0.25 },
    list: { paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
    msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    msgRowMe: { justifyContent: "flex-end" },
    avatar: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: "center", justifyContent: "center",
      flexShrink: 0, marginBottom: 2,
    },
    avatarText: { fontSize: 13, fontWeight: "700" },
    bubbleWrap: { maxWidth: "75%", gap: 3 },
    bubbleWrapMe: { alignItems: "flex-end" },
    meta: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
    author: { fontSize: 11, fontWeight: "700", color: colors.text, opacity: 0.6 },
    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
    bubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
    bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    bubbleTextMe: { color: "#fff" },
    bubbleTime: { fontSize: 10, color: colors.text, opacity: 0.35, alignSelf: "flex-end" },
    bubbleTimeMe: { color: "rgba(255,255,255,0.55)", opacity: 1 },
    roleBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    roleBadgeText: { fontSize: 10, fontWeight: "700" },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.secondary,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      fontSize: 14,
      color: colors.text,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.35 },
  });

  return (
    <View style={s.container}>
      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : messages.length === 0 ? (
        <View style={s.empty}>
          <MaterialIcons name="chat-bubble-outline" size={48} color={colors.text} style={{ opacity: 0.15, marginBottom: 4 }} />
          <Text style={s.emptyText}>Aucun message pour l&apos;instant.</Text>
          <Text style={s.emptySubtext}>Soyez le premier à commenter.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: msg }) => {
            const isMe = msg.author_user_id === dbUserId;
            const role = msg.author_role;
            const isStaff = role === "Agent" || role === "Admin";
            const roleColor = role === "Agent" ? ROLE_COLORS.Agent : role === "Admin" ? ROLE_COLORS.Admin : colors.text + "55";
            const displayName = msg.author_name ?? (role === "Agent" ? "Agent" : role === "Admin" ? "Admin" : "Citoyen");

            return (
              <View style={[s.msgRow, isMe && s.msgRowMe]}>
                {!isMe && (
                  <View style={[s.avatar, { backgroundColor: isStaff ? roleColor : colors.secondary }]}>
                    <Text style={[s.avatarText, { color: isStaff ? "#fff" : colors.text }]}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[s.bubbleWrap, isMe && s.bubbleWrapMe]}>
                  {!isMe && (
                    <View style={s.meta}>
                      <Text style={s.author}>{displayName}</Text>
                      {isStaff && (
                        <View style={[s.roleBadge, { backgroundColor: roleColor + "22" }]}>
                          <Text style={[s.roleBadgeText, { color: roleColor }]}>
                            {role === "Agent" ? "Agent" : "Admin"}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                  <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
                    <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{msg.content}</Text>
                    <Text style={[s.bubbleTime, isMe && s.bubbleTimeMe]}>{timeAgo(msg.created_at)}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={connected ? "Votre message…" : "Hors ligne"}
          placeholderTextColor={colors.text + "55"}
          editable={connected && !sending}
          maxLength={2000}
          multiline
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[s.sendBtn, (!connected || !inputText.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!connected || !inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <MaterialIcons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}
