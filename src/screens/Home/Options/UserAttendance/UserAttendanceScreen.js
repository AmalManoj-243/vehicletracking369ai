import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from '@components/containers';
import { NavigationHeader } from '@components/Header';
import { RoundedScrollContainer } from '@components/containers';
import { COLORS, FONT_FAMILY } from '@constants/theme';
import { OverlayLoader } from '@components/Loader';
import { showToastMessage } from '@components/Toast';
import { useAuthStore } from '@stores/auth';
import { checkInByEmployeeId, checkOutToOdoo, getTodayAttendanceByEmployeeId, verifyEmployeePin, verifyAttendanceLocation, debugListAllEmployees, uploadAttendancePhoto } from '@services/AttendanceService';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';

const { width } = Dimensions.get('window');

const UserAttendanceScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null); // { verified, distance, workplaceName }
  const currentUser = useAuthStore(state => state.user);

  // Camera state
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState('check_in'); // 'check_in' or 'check_out'
  const [countdown, setCountdown] = useState(3);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Debug: List all employees on mount to see field names
  useEffect(() => {
    debugListAllEmployees();
  }, []);

  // Camera countdown and auto-capture
  useEffect(() => {
    let timer;
    if (showCamera && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showCamera && countdown === 0 && !isCapturing) {
      capturePhoto();
    }
    return () => clearTimeout(timer);
  }, [showCamera, countdown, isCapturing]);

  const openCamera = async (type) => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showToastMessage('Camera permission is required');
        return false;
      }
    }
    setCameraType(type);
    setCountdown(3);
    setIsCapturing(false);
    setShowCamera(true);
    return true;
  };

  const closeCamera = () => {
    setShowCamera(false);
    setCountdown(3);
    setIsCapturing(false);
  };

  const capturePhoto = async () => {
    if (isCapturing || !cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      console.log('[Attendance] Photo captured, size:', photo.base64?.length);
      closeCamera();

      // Proceed with check-in or check-out
      if (cameraType === 'check_in') {
        await processCheckIn(photo.base64);
      } else {
        await processCheckOut(photo.base64);
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      showToastMessage('Failed to capture photo');
      closeCamera();
      setLoading(false);
    }
  };

  // Load today's attendance for employee (called after PIN verification)
  const loadTodayAttendanceForEmployee = async (employeeId, employeeName) => {
    try {
      const attendance = await getTodayAttendanceByEmployeeId(employeeId, employeeName);
      setTodayAttendance(attendance);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatTimeOnly = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handlePinSubmit = async () => {
    if (pin.trim().length === 0) {
      showToastMessage('Please enter your Badge ID');
      return;
    }

    setLoading(true);
    try {
      // Find employee by PIN
      const result = await verifyEmployeePin(null, pin);

      if (result.success) {
        setIsVerified(true);
        setVerifiedEmployee(result.employee);
        showToastMessage(`Welcome, ${result.employee.name}!`);

        // Load today's attendance for this employee
        await loadTodayAttendanceForEmployee(result.employee.id, result.employee.name);
      } else {
        showToastMessage(result.error || 'Employee not found');
        setPin('');
      }
    } catch (error) {
      console.error('Badge ID lookup error:', error);
      showToastMessage('Failed to find employee');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!verifiedEmployee?.id) {
      showToastMessage('Please verify Badge ID first');
      return;
    }

    setLoading(true);
    // Open camera for photo capture
    const cameraOpened = await openCamera('check_in');
    if (!cameraOpened) {
      setLoading(false);
    }
  };

  const processCheckIn = async (photoBase64) => {
    try {
      // First verify location (use employee's userId if available, otherwise skip user-based lookup)
      const locationResult = await verifyAttendanceLocation(verifiedEmployee.userId || currentUser?.uid);

      if (!locationResult.success) {
        showToastMessage(locationResult.error || 'Location verification failed');
        setLocationStatus({ verified: false, error: locationResult.error });
        setLoading(false);
        return;
      }

      if (!locationResult.withinRange) {
        showToastMessage(`You are ${locationResult.distance}m away from ${locationResult.workplaceName || 'workplace'}. Must be within ${locationResult.threshold}m.`);
        setLocationStatus({
          verified: false,
          distance: locationResult.distance,
          threshold: locationResult.threshold,
          workplaceName: locationResult.workplaceName,
        });
        setLoading(false);
        return;
      }

      // Location verified, proceed with check-in
      setLocationStatus({
        verified: true,
        distance: locationResult.distance,
        workplaceName: locationResult.workplaceName,
      });

      const result = await checkInByEmployeeId(verifiedEmployee.id, verifiedEmployee.name);
      if (result.success) {
        // Upload photo to Odoo
        if (photoBase64) {
          const uploadResult = await uploadAttendancePhoto(result.attendanceId, photoBase64, 'check_in');
          if (uploadResult.success) {
            console.log('[Attendance] Check-in photo uploaded successfully');
          } else {
            console.warn('[Attendance] Check-in photo upload failed:', uploadResult.error);
          }
        }

        showToastMessage('Check-in successful!');
        setTodayAttendance({
          id: result.attendanceId,
          checkIn: result.checkInTime,
          checkOut: null,
          employeeName: result.employeeName,
        });
      } else {
        showToastMessage(result.error || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      showToastMessage('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance?.id) {
      showToastMessage('No check-in record found');
      return;
    }

    if (!verifiedEmployee?.id) {
      showToastMessage('Please verify Badge ID first');
      return;
    }

    setLoading(true);
    // Open camera for photo capture
    const cameraOpened = await openCamera('check_out');
    if (!cameraOpened) {
      setLoading(false);
    }
  };

  const processCheckOut = async (photoBase64) => {
    try {
      // First verify location
      const locationResult = await verifyAttendanceLocation(verifiedEmployee.userId || currentUser?.uid);

      if (!locationResult.success) {
        showToastMessage(locationResult.error || 'Location verification failed');
        setLocationStatus({ verified: false, error: locationResult.error });
        setLoading(false);
        return;
      }

      if (!locationResult.withinRange) {
        showToastMessage(`You are ${locationResult.distance}m away from ${locationResult.workplaceName || 'workplace'}. Must be within ${locationResult.threshold}m.`);
        setLocationStatus({
          verified: false,
          distance: locationResult.distance,
          threshold: locationResult.threshold,
          workplaceName: locationResult.workplaceName,
        });
        setLoading(false);
        return;
      }

      // Location verified, proceed with check-out
      setLocationStatus({
        verified: true,
        distance: locationResult.distance,
        workplaceName: locationResult.workplaceName,
      });

      const result = await checkOutToOdoo(todayAttendance.id);
      if (result.success) {
        // Upload photo to Odoo
        if (photoBase64) {
          const uploadResult = await uploadAttendancePhoto(todayAttendance.id, photoBase64, 'check_out');
          if (uploadResult.success) {
            console.log('[Attendance] Check-out photo uploaded successfully');
          } else {
            console.warn('[Attendance] Check-out photo upload failed:', uploadResult.error);
          }
        }

        showToastMessage('Check-out successful!');
        setTodayAttendance({
          ...todayAttendance,
          checkOut: result.checkOutTime,
        });
      } else {
        showToastMessage(result.error || 'Check-out failed');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      showToastMessage('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const userName = verifiedEmployee?.name || currentUser?.name || currentUser?.user_name || currentUser?.login || 'User';
  const hasCheckedIn = todayAttendance && !todayAttendance.checkOut;
  const hasCheckedOut = todayAttendance && todayAttendance.checkOut;

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <NavigationHeader
        title="Attendance"
        color={COLORS.black}
        backgroundColor={COLORS.white}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <RoundedScrollContainer style={styles.content}>
          {/* Header Card with Date & Time */}
          <View style={styles.headerCard}>
            <View style={styles.headerTop}>
              <View style={styles.dateSection}>
                <View style={styles.iconCircle}>
                  <Feather name="calendar" size={20} color={COLORS.white} />
                </View>
                <View style={styles.dateTextContainer}>
                  <Text style={styles.dateLabel}>Today</Text>
                  <Text style={styles.dateValue}>{formatDate(currentTime)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.timeSection}>
              <View style={styles.timeIconContainer}>
                <Ionicons name="time-outline" size={28} color={COLORS.primaryThemeColor} />
              </View>
              <Text style={styles.timeValue}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeLabel}>Live Time</Text>
            </View>
          </View>

          {!isVerified ? (
            /* PIN Input Section */
            <View style={styles.pinSection}>
              <View style={styles.pinHeader}>
                <View style={styles.lockIconContainer}>
                  <MaterialIcons name="lock-outline" size={32} color={COLORS.primaryThemeColor} />
                </View>
                <Text style={styles.pinTitle}>Employee Verification</Text>
                <Text style={styles.pinSubtitle}>Enter your Badge ID to mark attendance</Text>
              </View>

              <View style={styles.pinInputContainer}>
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={setPin}
                  placeholder="Enter Badge ID"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (pin.trim().length === 0 || loading) && styles.verifyButtonDisabled
                ]}
                onPress={handlePinSubmit}
                disabled={pin.trim().length === 0 || loading}
              >
                <Feather name="check-circle" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* User Details & Submit Section */
            <View style={styles.detailsSection}>
              {/* Greeting Card */}
              <View style={styles.greetingCard}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.statusDot} />
                </View>
                <View style={styles.greetingTextContainer}>
                  <Text style={styles.greetingText}>{getGreeting()}</Text>
                  <Text style={styles.userNameText}>{userName}</Text>
                </View>
              </View>

              {/* Status Cards */}
              <View style={styles.statusCardsContainer}>
                <View style={[styles.statusCard, todayAttendance?.checkIn ? styles.statusCardActive : styles.statusCardInactive]}>
                  <View style={[styles.statusIconContainer, { backgroundColor: todayAttendance?.checkIn ? '#E8F5E9' : '#F5F5F5' }]}>
                    <MaterialIcons
                      name="login"
                      size={24}
                      color={todayAttendance?.checkIn ? '#4CAF50' : COLORS.gray}
                    />
                  </View>
                  <Text style={styles.statusCardLabel}>Check In</Text>
                  <Text style={[
                    styles.statusCardValue,
                    todayAttendance?.checkIn && { color: '#4CAF50' }
                  ]}>
                    {todayAttendance?.checkIn || '--:--'}
                  </Text>
                </View>

                <View style={[styles.statusCard, todayAttendance?.checkOut ? styles.statusCardActive : styles.statusCardInactive]}>
                  <View style={[styles.statusIconContainer, { backgroundColor: todayAttendance?.checkOut ? '#FFEBEE' : '#F5F5F5' }]}>
                    <MaterialIcons
                      name="logout"
                      size={24}
                      color={todayAttendance?.checkOut ? '#F44336' : COLORS.gray}
                    />
                  </View>
                  <Text style={styles.statusCardLabel}>Check Out</Text>
                  <Text style={[
                    styles.statusCardValue,
                    todayAttendance?.checkOut && { color: '#F44336' }
                  ]}>
                    {todayAttendance?.checkOut || '--:--'}
                  </Text>
                </View>
              </View>

              {/* Location Status Card */}
              {locationStatus && (
                <View style={[
                  styles.locationStatusCard,
                  locationStatus.verified ? styles.locationVerified : styles.locationNotVerified
                ]}>
                  <View style={styles.locationIconContainer}>
                    <MaterialIcons
                      name={locationStatus.verified ? "location-on" : "location-off"}
                      size={24}
                      color={locationStatus.verified ? '#4CAF50' : '#F44336'}
                    />
                  </View>
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationStatusTitle}>
                      {locationStatus.verified ? 'Location Verified' : 'Outside Workplace Range'}
                    </Text>
                    {locationStatus.distance !== undefined && (
                      <Text style={styles.locationStatusSubtitle}>
                        {locationStatus.distance}m from {locationStatus.workplaceName || 'workplace'}
                        {!locationStatus.verified && ` (max ${locationStatus.threshold}m)`}
                      </Text>
                    )}
                    {locationStatus.error && (
                      <Text style={styles.locationStatusSubtitle}>{locationStatus.error}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Current Time Info */}
              <View style={styles.currentTimeCard}>
                <Feather name="clock" size={18} color={COLORS.primaryThemeColor} />
                <Text style={styles.currentTimeLabel}>Current Time:</Text>
                <Text style={styles.currentTimeValue}>{formatTimeOnly(currentTime)}</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {!hasCheckedIn && !hasCheckedOut && (
                  <TouchableOpacity
                    style={styles.checkInButton}
                    onPress={handleCheckIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonIconContainer}>
                      <MaterialIcons name="fingerprint" size={28} color={COLORS.white} />
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Check In</Text>
                      <Text style={styles.buttonSubtitle}>Tap to mark your arrival</Text>
                    </View>
                    <Feather name="chevron-right" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                )}

                {hasCheckedIn && (
                  <TouchableOpacity
                    style={styles.checkOutButton}
                    onPress={handleCheckOut}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonIconContainer}>
                      <MaterialIcons name="fingerprint" size={28} color={COLORS.white} />
                    </View>
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonTitle}>Check Out</Text>
                      <Text style={styles.buttonSubtitle}>Tap to mark your departure</Text>
                    </View>
                    <Feather name="chevron-right" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                )}

                {hasCheckedOut && (
                  <View style={styles.completedContainer}>
                    <View style={styles.completedIconContainer}>
                      <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                    </View>
                    <Text style={styles.completedTitle}>All Done!</Text>
                    <Text style={styles.completedText}>Your attendance is complete for today</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </RoundedScrollContainer>
      </KeyboardAvoidingView>

      <OverlayLoader visible={loading && !showCamera} />

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={closeCamera}
      >
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={Camera.Constants.Type.front}
          >
            <View style={styles.cameraOverlay}>
              {/* Header */}
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  style={styles.cameraCloseButton}
                  onPress={() => {
                    closeCamera();
                    setLoading(false);
                  }}
                >
                  <MaterialIcons name="close" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>
                  {cameraType === 'check_in' ? 'Check In Photo' : 'Check Out Photo'}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Face Guide */}
              <View style={styles.faceGuideContainer}>
                <View style={styles.faceGuide}>
                  <MaterialIcons name="face" size={120} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={styles.faceGuideText}>Position your face in the frame</Text>
              </View>

              {/* Countdown */}
              <View style={styles.countdownContainer}>
                {countdown > 0 ? (
                  <>
                    <Text style={styles.countdownNumber}>{countdown}</Text>
                    <Text style={styles.countdownText}>Taking photo in...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="camera" size={48} color={COLORS.white} />
                    <Text style={styles.countdownText}>Capturing...</Text>
                  </>
                )}
              </View>
            </View>
          </Camera>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTop: {
    marginBottom: 20,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryThemeColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  timeSection: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeIconContainer: {
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 44,
    fontWeight: 'bold',
    color: COLORS.primaryThemeColor,
    fontFamily: FONT_FAMILY.urbanistBold,
    letterSpacing: 2,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pinSection: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  pinHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    fontFamily: FONT_FAMILY.urbanistBold,
    marginBottom: 4,
  },
  pinSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
  },
  pinInputContainer: {
    marginBottom: 20,
  },
  pinInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.urbanistBold,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  verifyButton: {
    backgroundColor: COLORS.primaryThemeColor,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: '#CCC',
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  detailsSection: {
    flex: 1,
  },
  greetingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryThemeColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  statusCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusCardActive: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  statusCardInactive: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusCardLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  currentTimeCard: {
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currentTimeLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginLeft: 8,
  },
  currentTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryThemeColor,
    fontFamily: FONT_FAMILY.urbanistBold,
    marginLeft: 6,
  },
  locationStatusCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationVerified: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  locationNotVerified: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationStatusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  locationStatusSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 4,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkOutButton: {
    backgroundColor: '#F44336',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: FONT_FAMILY.urbanistBold,
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONT_FAMILY.urbanistMedium,
  },
  completedContainer: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  completedIconContainer: {
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: FONT_FAMILY.urbanistBold,
    marginBottom: 4,
  },
  completedText: {
    fontSize: 14,
    color: COLORS.gray,
    fontFamily: FONT_FAMILY.urbanistMedium,
    textAlign: 'center',
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  faceGuideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  faceGuideText: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.urbanistMedium,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.white,
    fontFamily: FONT_FAMILY.urbanistBold,
  },
  countdownText: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: FONT_FAMILY.urbanistMedium,
    marginTop: 8,
  },
});

export default UserAttendanceScreen;
