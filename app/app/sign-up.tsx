import { View, Text, Pressable, TextInput, Keyboard, Alert, ActivityIndicator, Modal, FlatList } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";

// Country codes for the picker
const COUNTRY_CODES = [
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
];

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  // Auth store
  const { sendOtp, verifyOtp, loading, error, clearError } = useAuthStore();

  // Step management
  const [step, setStep] = useState(1);

  // Step 1: Name and phone
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]); // Default to Thailand
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Step 2: OTP (6 digits for Supabase)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, resendTimer]);

  // Format phone number for Supabase (E.164 format)
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    let digits = phone.replace(/\D/g, "");

    // If starts with 0 (local format), remove the leading 0
    if (digits.startsWith("0")) {
      digits = digits.substring(1);
    }

    // Combine country code with phone number
    return countryCode.code + digits;
  };

  const isStep1Valid = firstName.trim().length > 0 && phoneNumber.trim().length >= 9;
  const isOtpComplete = otp.every((digit) => digit !== "");

  const handleContinue = async () => {
    if (!isStep1Valid || loading) return;

    const formatted = formatPhoneNumber(phoneNumber);
    setFormattedPhone(formatted);

    const result = await sendOtp(formatted);

    if (result.success) {
      setStep(2);
      setResendTimer(30);
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      Alert.alert(
        "Couldn't send code",
        result.error || "Please check your phone number and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    console.log("[SIGNUP] OTP change - index:", index, "value:", value);

    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete (6 digits)
    if (index === 5 && value) {
      const fullOtp = newOtp.join("");
      console.log("[SIGNUP] All 6 digits entered, fullOtp:", fullOtp);
      if (fullOtp.length === 6) {
        console.log("[SIGNUP] Auto-submitting OTP...");
        handleVerifyOtp(fullOtp);
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (code: string) => {
    console.log("[SIGNUP] handleVerifyOtp called with code:", code);
    console.log("[SIGNUP] formattedPhone:", formattedPhone);
    console.log("[SIGNUP] firstName:", firstName.trim());

    if (loading) {
      console.log("[SIGNUP] Already loading, returning");
      return;
    }

    Keyboard.dismiss();

    console.log("[SIGNUP] Calling verifyOtp...");
    const result = await verifyOtp(formattedPhone, code, firstName.trim());
    console.log("[SIGNUP] verifyOtp result:", result);

    if (result.success) {
      console.log("[SIGNUP] Success! Navigating to map...");
      // Navigate to the return destination or map
      const destination = params.returnTo || "/map";
      router.replace(destination as any);
    } else {
      console.log("[SIGNUP] Failed:", result.error);
      Alert.alert(
        "Invalid code",
        result.error || "Please check the code and try again.",
        [{ text: "OK" }]
      );
      // Clear OTP and refocus
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;

    const result = await sendOtp(formattedPhone);

    if (result.success) {
      setResendTimer(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } else {
      Alert.alert(
        "Couldn't resend code",
        result.error || "Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp(["", "", "", "", "", ""]);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header with back button */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">←</Text>
        </Pressable>
      </View>

      <View className="flex-1 px-6">
        {step === 1 ? (
          <>
            {/* Step 1: Name and Phone */}
            <View className="pt-4">
              <Text className="text-center text-[28px] font-normal text-[#1C1917]">
                Almost there.
              </Text>
              <Text className="text-center text-[17px] text-[#6B7280] mt-2">
                Just a name and a phone number.
              </Text>
            </View>

            {/* Form inputs */}
            <View className="mt-8">
              {/* First name input */}
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                autoCorrect={false}
                className="border border-[#E5E7EB] rounded-xl px-4 py-4 text-[16px] text-[#1C1917] bg-white"
              />

              {/* Phone number input with country code */}
              <View className="flex-row mt-4">
                {/* Country code picker button */}
                <Pressable
                  onPress={() => setShowCountryPicker(true)}
                  className="border border-[#E5E7EB] rounded-xl px-3 py-4 bg-white flex-row items-center mr-2"
                >
                  <Text className="text-[18px]">{countryCode.flag}</Text>
                  <Text className="text-[16px] text-[#1C1917] ml-1">{countryCode.code}</Text>
                  <Text className="text-[12px] text-[#9CA3AF] ml-1">▼</Text>
                </Pressable>

                {/* Phone number input */}
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-4 text-[16px] text-[#1C1917] bg-white"
                />
              </View>

              {/* Helper text */}
              <Text className="text-center text-[14px] text-[#9CA3AF] mt-3">
                We'll text you a code to verify.
              </Text>
            </View>

            {/* Continue button */}
            <View className="mt-6">
              <Pressable
                onPress={handleContinue}
                disabled={!isStep1Valid || loading}
                className={`py-4 rounded-xl items-center ${
                  isStep1Valid && !loading
                    ? "bg-[#1C1917] active:opacity-80"
                    : "bg-[#E5E7EB]"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                ) : (
                  <Text
                    className={`text-[17px] font-medium ${
                      isStep1Valid ? "text-white" : "text-[#9CA3AF]"
                    }`}
                  >
                    Continue
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Terms link */}
            <Text className="text-center text-[14px] text-[#9CA3AF] mt-4">
              By continuing, you agree to our{" "}
              <Text className="text-[#6B7280] underline">terms</Text>.
            </Text>
          </>
        ) : (
          <>
            {/* Step 2: OTP Verification */}
            <View className="pt-4">
              <Text className="text-center text-[28px] font-normal text-[#1C1917]">
                Enter code
              </Text>
              <Text className="text-center text-[17px] text-[#6B7280] mt-2">
                We sent a code to {phoneNumber}
              </Text>
            </View>

            {/* OTP input boxes (6 digits for Supabase) */}
            <View className="flex-row justify-center mt-10">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpRefs.current[index] = ref; }}
                  value={otp[index]}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                  className={`w-12 h-14 mx-1 text-center text-[24px] font-medium text-[#1C1917] rounded-xl border-2 ${
                    otp[index] ? "border-[#1C1917]" : "border-[#E5E7EB]"
                  } bg-white`}
                />
              ))}
            </View>

            {/* Resend code */}
            <View className="mt-8">
              {resendTimer > 0 ? (
                <Text className="text-center text-[15px] text-[#9CA3AF]">
                  Resend code in {resendTimer}s
                </Text>
              ) : (
                <Pressable onPress={handleResendCode}>
                  <Text className="text-center text-[15px] text-[#1C1917] underline">
                    Resend code
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Verify button (optional, since auto-submit works) */}
            <View className="mt-8">
              <Pressable
                onPress={() => handleVerifyOtp(otp.join(""))}
                disabled={!isOtpComplete || loading}
                className={`py-4 rounded-xl items-center ${
                  isOtpComplete && !loading
                    ? "bg-[#1C1917] active:opacity-80"
                    : "bg-[#E5E7EB]"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                ) : (
                  <Text
                    className={`text-[17px] font-medium ${
                      isOtpComplete ? "text-white" : "text-[#9CA3AF]"
                    }`}
                  >
                    Verify
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={step === 1 ? handleContinue : () => handleVerifyOtp(otp.join(""))}
          disabled={loading || (step === 1 ? !isStep1Valid : !isOtpComplete)}
          className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${
            !loading && (step === 1 ? isStep1Valid : isOtpComplete)
              ? "bg-[#1F2937] active:opacity-80"
              : "bg-[#9CA3AF]"
          }`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white text-2xl font-light">›</Text>
          )}
        </Pressable>
      </View>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowCountryPicker(false)}
        >
          <View className="bg-white rounded-t-3xl max-h-[60%]">
            <View className="p-4 border-b border-[#E5E7EB]">
              <Text className="text-center text-[18px] font-semibold text-[#1C1917]">
                Select Country
              </Text>
            </View>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setCountryCode(item);
                    setShowCountryPicker(false);
                  }}
                  className={`flex-row items-center px-5 py-4 border-b border-[#F3F4F6] ${
                    countryCode.code === item.code ? "bg-[#F9FAFB]" : ""
                  }`}
                >
                  <Text className="text-[24px] mr-3">{item.flag}</Text>
                  <Text className="text-[16px] text-[#1C1917] flex-1">{item.country}</Text>
                  <Text className="text-[16px] text-[#6B7280]">{item.code}</Text>
                  {countryCode.code === item.code && (
                    <Text className="text-[#22C55E] ml-2">✓</Text>
                  )}
                </Pressable>
              )}
            />
            <View className="p-4 pb-8">
              <Pressable
                onPress={() => setShowCountryPicker(false)}
                className="bg-[#F3F4F6] py-3 rounded-xl items-center"
              >
                <Text className="text-[16px] text-[#6B7280]">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
