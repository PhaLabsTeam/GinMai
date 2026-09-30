import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useMomentStore } from "../src/stores/momentStore";

export default function MenuScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const fetchMyActiveMoment = useMomentStore((state) => state.fetchMyActiveMoment);
  const [findingMoment, setFindingMoment] = useState(false);
  const [noActiveMoment, setNoActiveMoment] = useState(false);

  const handleClose = () => {
    router.back();
  };

  const handleMyMoments = async () => {
    if (!user) {
      router.push("/sign-up?returnTo=/menu");
      return;
    }
    if (findingMoment) return;

    setFindingMoment(true);
    setNoActiveMoment(false);
    const active = await fetchMyActiveMoment(user.id);
    setFindingMoment(false);

    if (!active) {
      setNoActiveMoment(true);
    } else if (active.role === "host") {
      router.push(`/moment-live?momentId=${active.moment.id}`);
    } else {
      router.push(`/confirmation?momentId=${active.moment.id}`);
    }
  };

  const handleSafety = () => {
    router.push("/safety");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 active:opacity-60"
    >
      <View className="w-8 items-center">{icon}</View>
      <Text className="text-[17px] text-[#1C1917] ml-3">{label}</Text>
    </Pressable>
  );

  // Location pin icon
  const LocationIcon = () => (
    <View className="w-5 h-5 items-center justify-center">
      <View className="w-4 h-5 border-2 border-[#1C1917] rounded-full rounded-b-none items-center pt-0.5">
        <View className="w-1.5 h-1.5 bg-[#1C1917] rounded-full" />
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderTopWidth: 5,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#1C1917",
          marginTop: -1,
        }}
      />
    </View>
  );

  // Shield icon
  const ShieldIcon = () => (
    <View className="w-5 h-6 border-2 border-[#1C1917] rounded-t-lg rounded-b-full" />
  );

  // Settings/gear icon
  const SettingsIcon = () => (
    <View className="w-5 h-5 border-2 border-[#1C1917] rounded-full items-center justify-center">
      <View className="w-1.5 h-1.5 bg-[#1C1917] rounded-full" />
    </View>
  );

  // Profile icon
  const ProfileIcon = () => (
    <View className="w-5 h-5 rounded-full border-2 border-[#1C1917] items-center overflow-hidden">
      <View className="w-1.5 h-1.5 bg-[#1C1917] rounded-full mt-0.5" />
      <View className="w-3.5 h-1.5 bg-[#1C1917] rounded-t-full mt-0.5" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-[17px] font-medium text-[#1C1917]">Menu</Text>
        <Pressable
          onPress={handleClose}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">×</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View className="h-px bg-[#F3F4F6]" />

      {/* Menu items */}
      <View className="px-6 pt-4">
        <MenuItem
          icon={<LocationIcon />}
          label="My Moments"
          onPress={handleMyMoments}
        />
        {findingMoment && (
          <ActivityIndicator size="small" color="#78716C" style={{ alignSelf: "flex-start", marginLeft: 44 }} />
        )}
        {noActiveMoment && (
          <Text className="text-[14px] text-[#78716C] ml-11 -mt-2 mb-2">
            Nothing planned right now.
          </Text>
        )}
        <MenuItem
          icon={<ProfileIcon />}
          label="Profile"
          onPress={handleProfile}
        />
        <MenuItem
          icon={<SettingsIcon />}
          label="Settings"
          onPress={handleSettings}
        />
        <MenuItem
          icon={<ShieldIcon />}
          label="Safety"
          onPress={handleSafety}
        />
      </View>

      {/* Divider */}
      <View className="h-px bg-[#F3F4F6] mt-4" />

      {/* Version info */}
      <View className="py-6">
        <Text className="text-center text-[14px] text-[#9CA3AF]">
          GinMai · Version 1.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
