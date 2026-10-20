/// <reference types="expo/types" />

// Expo tip tanımları. (expo-env.d.ts Expo tarafından üretilir ve git dışındadır.)

// Metro görselleri paketleyip bir varlık kimliği (number) döndürür.
declare module '*.png' {
  const asset: number;
  export default asset;
}
