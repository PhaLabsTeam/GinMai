import { View, Text, Pressable, TextInput, Keyboard, Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { friendlyAuthError } from "../src/utils/authErrors";
import { ALL_COUNTRIES, searchCountries, countryForNumber } from "../src/data/countries";
import { colors } from "../src/theme/colors";
import { Icon } from "../src/components/Icon";


const OTP_LENGTH = 6;

// "+66999999999" -> "+66 999 999 999" (country code from the picker list)
function formatPhoneForDisplay(e164: string): string {
  const country = countryForNumber(e164);
  if (!country) return e164;
  const local = e164.slice(country.code.length).replace(/(\d{3})(?=\d)/g, "$1 ");
  return `${country.code} ${local}`;
}

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  // Auth store
  const { sendOtp, verifyOtp, completeProfile, signOut, loading, clearError } = useAuthStore();

  // Step management
  const [step, setStep] = useState(1);

  // Step 1: Phone
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [countryCode, setCountryCode] = useState(ALL_COUNTRIES[0]); // Default to Thailand
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");

  // Step 2: OTP (6 digits for Supabase)
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const otpInputRef = useRef<TextInput>(null);

  // Step 3: Name (new users only)
  const [firstName, setFirstName] = useState("");

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

  const isStep1Valid = phoneNumber.trim().length >= 9;
  const isNameValid = firstName.trim().length > 0;
  const isOtpComplete = otp.length === OTP_LENGTH;

  const handleContinue = async () => {
    if (!isStep1Valid || loading) return;

    const formatted = formatPhoneNumber(phoneNumber);
    setFormattedPhone(formatted);

    const result = await sendOtp(formatted);

    if (result.success) {
      setStep(2);
      setResendTimer(30);
      // Focus first OTP input
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } else {
      Alert.alert("Couldn't send code", friendlyAuthError("send", result.error), [{ text: "OK" }]);
    }
  };

  const finishSignIn = () => {
    const destination = params.returnTo || "/map";
    router.replace(destination as any);
  };

  // One input holds the whole code: typing fast, pasting and SMS autofill all
  // arrive as a single change, which six separate inputs couldn't handle
  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(digits);
    if (digits.length === OTP_LENGTH) {
      handleVerifyOtp(digits);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (loading) return;

    Keyboard.dismiss();

    const result = await verifyOtp(formattedPhone, code);

    if (result.success) {
      if (result.needsProfile) {
        setStep(3);
      } else {
        finishSignIn();
      }
    } else {
      Alert.alert("Invalid code", friendlyAuthError("verify", result.error), [{ text: "OK" }]);
      // Clear OTP and refocus
      setOtp("");
      otpInputRef.current?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;

    const result = await sendOtp(formattedPhone);

    if (result.success) {
      setResendTimer(30);
      setOtp("");
      otpInputRef.current?.focus();
    } else {
      Alert.alert("Couldn't resend code", friendlyAuthError("send", result.error), [{ text: "OK" }]);
    }
  };

  const handleSaveName = async () => {
    if (!isNameValid || loading) return;

    Keyboard.dismiss();
    const result = await completeProfile(formattedPhone, firstName);

    if (result.success) {
      finishSignIn();
    } else {
      Alert.alert("Couldn't save", friendlyAuthError("profile", result.error), [{ text: "OK" }]);
    }
  };

  const handleBack = async () => {
    if (step === 3) {
      // Verified but no profile yet: leaving means starting over
      await signOut();
      setFirstName("");
      setOtp("");
      setStep(1);
    } else if (step === 2) {
      setStep(1);
      setOtp("");
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with back button */}
      <View className="flex-row items-center px-5 py-3">
        <Pressable
          accessibilityLabel="Back"
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
        >
          <Icon name="arrow-back" size={24} />
        </Pressable>
      </View>

      <View className="flex-1 px-6">
        {step === 1 ? (
          <>
            {/* Step 1: Phone */}
            <View className="pt-4">
              <Text className="text-center text-[28px] font-normal text-ink">
                Almost there.
              </Text>
              <Text className="text-center text-[17px] text-ink-secondary mt-2">
                Just a phone number.
              </Text>
            </View>

            {/* Form inputs */}
            <View className="mt-8">
              {/* Phone number input with country code */}
              <View className="flex-row">
                {/* Country code picker button */}
                <Pressable
                  onPress={() => setShowCountryPicker(true)}
                  className="border border-line rounded-xl px-3 py-4 bg-surface flex-row items-center mr-2"
                >
                  <Text className="text-[18px]">{countryCode.flag}</Text>
                  <Text className="text-[16px] text-ink ml-1">{countryCode.code}</Text>
                  <View className="ml-1"><Icon name="chevron-down" size={14} color={colors.inkMuted} /></View>
                </Pressable>

                {/* Phone number input */}
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Phone number"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoFocus
                  className="flex-1 border border-line rounded-xl px-4 py-4 text-[16px] text-ink bg-surface"
                />
              </View>

              {/* Helper text */}
              <Text className="text-center text-[14px] text-ink-muted mt-3">
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
                    ? "bg-ink active:opacity-80"
                    : "bg-line"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.inkMuted} />
                ) : (
                  <Text
                    className={`text-[17px] font-medium ${
                      isStep1Valid ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    Continue
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Terms link */}
            <Text className="text-center text-[14px] text-ink-muted mt-4">
              By continuing, you agree to our{" "}
              <Text
                className="text-ink-secondary underline"
                onPress={() => router.push("/terms")}
                accessibilityRole="link"
              >
                terms
              </Text>
              {" "}and{" "}
              <Text
                className="text-ink-secondary underline"
                onPress={() => router.push("/privacy")}
                accessibilityRole="link"
              >
                privacy policy
              </Text>.
            </Text>
          </>
        ) : step === 2 ? (
          <>
            {/* Step 2: OTP Verification */}
            <View className="pt-4">
              <Text className="text-center text-[28px] font-normal text-ink">
                Enter code
              </Text>
              <Text className="text-center text-[17px] text-ink-secondary mt-2">
                We sent a code to {formatPhoneForDisplay(formattedPhone)}
              </Text>
            </View>

            {/* OTP: six boxes drawn over one hidden input (6 digits for Supabase) */}
            <Pressable
              onPress={() => otpInputRef.current?.focus()}
              accessible={false}
              className="flex-row justify-center mt-10"
            >
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <View
                  key={index}
                  className={`w-12 h-14 mx-1 items-center justify-center rounded-xl border-2 ${
                    otp[index] || index === otp.length ? "border-ink" : "border-line"
                  } bg-surface`}
                >
                  <Text className="text-[24px] font-medium text-ink">{otp[index] ?? ""}</Text>
                </View>
              ))}
              <TextInput
                ref={otpInputRef}
                testID="otp-input"
                accessibilityLabel="Verification code"
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={OTP_LENGTH}
                editable={!loading}
                caretHidden
                // Covers the boxes so a tap anywhere focuses it; invisible
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: "transparent" }}
              />
            </Pressable>

            {/* Resend code */}
            <View className="mt-8">
              {resendTimer > 0 ? (
                <Text className="text-center text-[15px] text-ink-muted">
                  Resend code in {resendTimer}s
                </Text>
              ) : (
                <Pressable onPress={handleResendCode}>
                  <Text className="text-center text-[15px] text-ink underline">
                    Resend code
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Verify button (optional, since auto-submit works) */}
            <View className="mt-8">
              <Pressable
                onPress={() => handleVerifyOtp(otp)}
                disabled={!isOtpComplete || loading}
                className={`py-4 rounded-xl items-center ${
                  isOtpComplete && !loading
                    ? "bg-ink active:opacity-80"
                    : "bg-line"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.inkMuted} />
                ) : (
                  <Text
                    className={`text-[17px] font-medium ${
                      isOtpComplete ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    Verify
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* Step 3: Name (new users only) */}
            <View className="pt-4">
              <Text className="text-center text-[28px] font-normal text-ink">
                What should people call you?
              </Text>
              <Text className="text-center text-[17px] text-ink-secondary mt-2">
                Just your first name.
              </Text>
            </View>

            <View className="mt-8">
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={colors.inkMuted}
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                textContentType="givenName"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                className="border border-line rounded-xl px-4 py-4 text-[16px] text-ink bg-surface"
              />
            </View>

            <View className="mt-6">
              <Pressable
                onPress={handleSaveName}
                disabled={!isNameValid || loading}
                className={`py-4 rounded-xl items-center ${
                  isNameValid && !loading
                    ? "bg-ink active:opacity-80"
                    : "bg-line"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.inkMuted} />
                ) : (
                  <Text
                    className={`text-[17px] font-medium ${
                      isNameValid ? "text-white" : "text-ink-muted"
                    }`}
                  >
                    Continue
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Backdrop is a sibling behind the sheet, not its parent: a wrapping
              Pressable exposed the whole sheet as one accessibility element */}
          <Pressable
            className="absolute inset-0 bg-black/50"
            onPress={() => setShowCountryPicker(false)}
            accessibilityLabel="Close"
          />
          <View className="bg-surface rounded-t-3xl max-h-[80%]">
            <View className="p-4 border-b border-line">
              <Text className="text-center text-[18px] font-semibold text-ink">
                Select Country
              </Text>
            </View>
            <View className="px-4 pt-3">
              <TextInput
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder="Search country or code"
                placeholderTextColor={colors.inkMuted}
                autoCorrect={false}
                clearButtonMode="while-editing"
                className="border border-line rounded-xl px-4 py-3 text-[16px] text-ink bg-surface"
              />
            </View>
            <FlatList
              data={searchCountries(countryQuery)}
              // Dial codes aren't unique (+1, +7), country names are
              keyExtractor={(item) => item.country}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityLabel={`${item.country} ${item.code}`}
                  onPress={() => {
                    setCountryCode(item);
                    setShowCountryPicker(false);
                    setCountryQuery("");
                  }}
                  className={`flex-row items-center px-5 py-4 border-b border-subtle ${
                    countryCode.country === item.country ? "bg-subtle" : ""
                  }`}
                >
                  <Text className="text-[24px] mr-3">{item.flag}</Text>
                  <Text className="text-[16px] text-ink flex-1">{item.country}</Text>
                  <Text className="text-[16px] text-ink-secondary">{item.code}</Text>
                  {countryCode.country === item.country && (
                    <View className="ml-2"><Icon name="checkmark" size={18} color={colors.success} /></View>
                  )}
                </Pressable>
              )}
            />
            <View className="p-4 pb-8">
              <Pressable
                onPress={() => setShowCountryPicker(false)}
                className="bg-subtle py-3 rounded-xl items-center"
              >
                <Text className="text-[16px] text-ink-secondary">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
