import { View, Text, Pressable, ScrollView, Switch, Alert, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useAuthStore } from "../src/stores/authStore";

export default function SettingsScreen() {
  const router = useRouter();

  // Auth state
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const loading = useAuthStore((state) => state.loading);

  // Toggle states
  const [autoAccept, setAutoAccept] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [joinNotifications, setJoinNotifications] = useState(true);

  const handleBack = () => {
    router.back();
  };

  // Mask phone number for display (e.g., +66 XX XXX XX34)
  const maskPhone = (phone: string): string => {
    if (!phone || phone.length < 4) return phone;
    // Show country code + last 2 digits, mask the rest
    const countryCode = phone.slice(0, 3); // e.g., +66
    const lastTwo = phone.slice(-2);
    const maskedLength = phone.length - 5; // -3 for country code, -2 for last digits
    const masked = "X".repeat(Math.max(maskedLength, 4));
    return `${countryCode} ${masked}${lastTwo}`;
  };

  // Format joined date
  const formatJoinedDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  const handleLogout = async () => {
    // Use window.confirm for web, Alert.alert for native
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to log out?");
      if (confirmed) {
        await signOut();
        router.replace("/");
      }
    } else {
      Alert.alert(
        "Log out",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log out",
            style: "destructive",
            onPress: async () => {
              await signOut();
              router.replace("/");
            },
          },
        ]
      );
    }
  };

  const SettingRow = ({
    label,
    sublabel,
    onPress,
    showArrow = true,
    isDestructive = false,
  }: {
    label: string;
    sublabel?: string;
    onPress?: () => void;
    showArrow?: boolean;
    isDestructive?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 bg-white rounded-xl mb-3 active:bg-[#F9FAFB]"
    >
      <View className="flex-1">
        {sublabel && (
          <Text className="text-[13px] text-[#9CA3AF]">{sublabel}</Text>
        )}
        <Text
          className={`text-[16px] ${
            isDestructive ? "text-[#EF4444]" : "text-[#1C1917]"
          }`}
        >
          {label}
        </Text>
      </View>
      {showArrow && (
        <Text className={`text-[18px] ${isDestructive ? "text-[#EF4444]" : "text-[#9CA3AF]"}`}>
          →
        </Text>
      )}
    </Pressable>
  );

  const ToggleRow = ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View className="flex-row items-center justify-between px-4 py-4 bg-white rounded-xl mb-3">
      <Text className="text-[16px] text-[#1C1917]">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E5E7EB", true: "#1C1917" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-[14px] text-[#6B7280] mb-3 mt-2">{title}</Text>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">←</Text>
        </Pressable>
        <Text className="text-[17px] font-medium text-[#1C1917] ml-2">
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Account section */}
        <SectionHeader title="Account" />
        {user ? (
          <>
            <SettingRow
              sublabel="Name"
              label={user.first_name}
              showArrow={false}
            />
            <SettingRow
              sublabel="Phone number"
              label={maskPhone(user.phone)}
              showArrow={false}
            />
            <SettingRow
              sublabel="Member since"
              label={formatJoinedDate(user.created_at)}
              showArrow={false}
            />
            {user.phone_verified && (
              <View className="flex-row items-center px-4 py-3 bg-[#F0FDF4] rounded-xl mb-3">
                <Text className="text-[15px] text-[#22C55E]">✓</Text>
                <Text className="text-[15px] text-[#166534] ml-2">Phone verified</Text>
              </View>
            )}
          </>
        ) : (
          <Pressable
            onPress={() => router.push("/sign-up")}
            className="px-4 py-4 bg-white rounded-xl mb-3"
          >
            <Text className="text-[16px] text-[#1C1917]">Sign in to see your profile →</Text>
          </Pressable>
        )}

        {/* Hosting section */}
        <SectionHeader title="Hosting" />
        <ToggleRow
          label="Auto-accept guests"
          value={autoAccept}
          onValueChange={setAutoAccept}
        />

        {/* Notifications section */}
        <SectionHeader title="Notifications" />
        <ToggleRow
          label="Meal reminders"
          value={mealReminders}
          onValueChange={setMealReminders}
        />
        <ToggleRow
          label="Someone wants to join"
          value={joinNotifications}
          onValueChange={setJoinNotifications}
        />

        {/* Privacy & Safety section */}
        <SectionHeader title="Privacy & Safety" />
        <SettingRow label="Blocked users" onPress={() => {}} />

        {/* Session section - only show if logged in */}
        {user && (
          <>
            <SectionHeader title="Session" />
            <Pressable
              onPress={handleLogout}
              disabled={loading}
              className="flex-row items-center justify-between px-4 py-4 bg-white rounded-xl mb-3 active:bg-[#F9FAFB]"
            >
              <Text className="text-[16px] text-[#1C1917]">Log out</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <Text className="text-[18px] text-[#9CA3AF]">→</Text>
              )}
            </Pressable>
          </>
        )}

        {/* Danger zone */}
        <SectionHeader title="Danger zone" />
        <SettingRow
          label="Delete account"
          onPress={() => {}}
          isDestructive
        />

        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={() => router.push("/map")}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
