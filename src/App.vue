<template>
  <v-app>
    <template v-if="authReady">
      <!-- ログイン状態の場合にナビゲーションバーを表示 -->
      <app-navbar 
        v-if="isLoggedIn" 
        :userData="userData"
        @logout="logout"
      />

      <!-- メインコンテンツエリア - v-mainを使ってナビゲーションバーと適切に分離 -->
      <v-main>
        <router-view />
      </v-main>
    </template>

    <!-- 認証準備中の場合はローディング表示 -->
    <v-main v-else>
      <v-container fill-height fluid>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="8" md="4">
            <v-card flat class="text-center">
              <v-progress-circular
                indeterminate
                color="primary"
                size="64"
                width="4"
              ></v-progress-circular>
              <v-card-text class="text-h6 mt-4">読み込み中...</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { onAuthStateChanged, logout } from '@/firebase/auth';
import { getUser } from '@/firebase/firestore';
import AppNavbar from '@/components/common/AppNavbar.vue';

export default {
  name: 'App',
  components: {
    AppNavbar
  },
  data() {
    return {
      authReady: false,
      isLoggedIn: false,
      userData: null,
      unsubscribe: null
    };
  },
  created() {
    console.log('App.vue created - 初期化開始');
    // 初期化中フラグを追加
    let isInitializing = true;
    
    // Firebase Auth状態リスナーを設定
    this.unsubscribe = onAuthStateChanged(async (user) => {
      console.log('onAuthStateChanged 発火', {
        user: user ? '認証済み' : 'なし',
        isInitializing,
        currentPath: this.$route.path
      });
      
      if (user) {
        // ユーザーがログインしている場合
        try {
          // ユーザー情報をFirestoreから取得
          const userData = await getUser(user.uid);
          this.userData = userData;
          this.isLoggedIn = true;
          
          console.log('ユーザー情報取得成功:', userData);
        } catch (error) {
          console.error('ユーザー情報の取得に失敗:', error);
        }
      } else {
        // ユーザーがログアウトしている場合
        this.userData = null;
        this.isLoggedIn = false;
        
        console.log('ログアウト状態検出', {
          shouldRedirect: !isInitializing && 
                        this.$route.path !== '/login' && 
                        this.$route.path !== '/register',
          isInitializing
        });
        
        // 初期化完了後のみリダイレクト
        if (!isInitializing && 
            this.$route.path !== '/login' && 
            this.$route.path !== '/register') {
          console.log('ログインページへリダイレクト実行');
          this.$router.push('/login').catch(err => {
            // NavigationDuplicatedエラーは無視する
            if (err.name !== 'NavigationDuplicated') {
              console.error('ナビゲーションエラー:', err);
            }
          });
        }
      }
      
      // 初期化完了
      isInitializing = false;
      
      // 認証状態の読み込み完了
      this.authReady = true;
      console.log('認証状態読み込み完了', { isLoggedIn: this.isLoggedIn });
    });
  },
  beforeDestroy() {
    // コンポーネント破棄時にリスナーを解除
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    async logout() {
      try {
        await logout();
        // 現在のルートがすでに/loginの場合はリダイレクトしない
        if (this.$route.path !== '/login') {
          this.$router.push('/login').catch(err => {
            // NavigationDuplicatedエラーは無視する
            if (err.name !== 'NavigationDuplicated') {
              throw err;
            }
          });
        }
      } catch (error) {
        console.error('ログアウトに失敗しました:', error);
      }
    }
  }
};
</script>

<style>
/* グローバルスタイル */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

/* v-mainコンテンツのスタイル調整 */
.v-main {
  min-height: 100vh;
}

/* ローディング表示の調整 */
.v-progress-circular {
  margin: 0 auto;
}
</style>