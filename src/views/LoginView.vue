<template>
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>ブロックチェーン・エコノミーゲーム</h1>
          <p>仮想通貨を使ったシミュレーションゲーム</p>
        </div>
        
        <div v-if="error" class="alert alert-error">
          {{ errorMessage }}
        </div>
        
        <div class="tabs">
          <div 
            class="tab" 
            :class="{ active: activeTab === 'login' }" 
            @click="activeTab = 'login'"
          >
            ログイン
          </div>
          <div 
            class="tab" 
            :class="{ active: activeTab === 'register' }" 
            @click="activeTab = 'register'"
          >
            新規登録
          </div>
        </div>
        
        <!-- ログインフォーム -->
        <form v-if="activeTab === 'login'" class="login-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email" class="form-label">メールアドレス</label>
            <input 
              type="email" 
              id="login-email" 
              v-model="loginForm.email" 
              class="form-control" 
              required
            >
          </div>
          <div class="form-group">
            <label for="password" class="form-label">パスワード</label>
            <input 
              type="password" 
              id="login-password" 
              v-model="loginForm.password" 
              class="form-control" 
              required
            >
          </div>
          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            :disabled="loading"
          >
            {{ loading ? 'ログイン中...' : 'ログイン' }}
          </button>
          <div class="form-footer">
            <a href="#" @click.prevent="showPasswordReset = true">パスワードをお忘れですか？</a>
          </div>
        </form>
        
        <!-- 新規登録フォーム -->
        <form v-if="activeTab === 'register'" class="login-form" @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="register-username" class="form-label">ユーザー名</label>
            <input 
              type="text" 
              id="register-username" 
              v-model="registerForm.username" 
              class="form-control" 
              required
            >
          </div>
          <div class="form-group">
            <label for="register-email" class="form-label">メールアドレス</label>
            <input 
              type="email" 
              id="register-email" 
              v-model="registerForm.email" 
              class="form-control" 
              required
            >
          </div>
          <div class="form-group">
            <label for="register-password" class="form-label">パスワード</label>
            <input 
              type="password" 
              id="register-password" 
              v-model="registerForm.password" 
              class="form-control" 
              required
            >
            <small>パスワードは6文字以上で入力してください</small>
          </div>
          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            :disabled="loading"
          >
            {{ loading ? '登録中...' : '新規登録' }}
          </button>
        </form>
        
        <!-- パスワードリセットモーダル -->
        <div v-if="showPasswordReset" class="password-reset-modal">
          <div class="modal-content">
            <h2>パスワードのリセット</h2>
            <p>登録したメールアドレスにパスワードリセットのリンクを送信します。</p>
            
            <div v-if="resetSuccess" class="alert alert-success">
              パスワードリセットのメールを送信しました。メールに記載されているリンクからパスワードを再設定してください。
            </div>
            
            <form @submit.prevent="handlePasswordReset">
              <div class="form-group">
                <label for="reset-email" class="form-label">メールアドレス</label>
                <input 
                  type="email" 
                  id="reset-email" 
                  v-model="resetEmail" 
                  class="form-control" 
                  required
                >
              </div>
              <div class="modal-actions">
                <button 
                  type="button" 
                  class="btn btn-secondary" 
                  @click="showPasswordReset = false"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary" 
                  :disabled="loading"
                >
                  {{ loading ? '送信中...' : '送信' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { loginWithEmail, registerUser, sendPasswordResetEmail } from '@/firebase/auth';
  
  export default {
    name: 'LoginView',
    data() {
      return {
        activeTab: 'login',
        loginForm: {
          email: '',
          password: ''
        },
        registerForm: {
          username: '',
          email: '',
          password: ''
        },
        resetEmail: '',
        loading: false,
        error: false,
        errorMessage: '',
        showPasswordReset: false,
        resetSuccess: false
      };
    },
    methods: {
      async handleLogin() {
        this.error = false;
        this.loading = true;
        
        try {
          await loginWithEmail(this.loginForm.email, this.loginForm.password);
          // ログイン成功後、ダッシュボードへリダイレクト
          this.$router.push('/dashboard');
        } catch (error) {
          this.error = true;
          // エラーメッセージの日本語化
          switch(error.code) {
            case 'auth/user-not-found':
              this.errorMessage = 'ユーザーが見つかりません。';
              break;
            case 'auth/wrong-password':
              this.errorMessage = 'パスワードが間違っています。';
              break;
            case 'auth/invalid-email':
              this.errorMessage = 'メールアドレスの形式が正しくありません。';
              break;
            default:
              this.errorMessage = 'ログインに失敗しました。もう一度お試しください。';
          }
        } finally {
          this.loading = false;
        }
      },
      async handleRegister() {
        this.error = false;
        this.loading = true;
        
        try {
          await registerUser(
            this.registerForm.email, 
            this.registerForm.password, 
            this.registerForm.username
          );
          // 登録成功後、ダッシュボードへリダイレクト
          this.$router.push('/dashboard');
        } catch (error) {
          this.error = true;
          // エラーメッセージの日本語化
          switch(error.code) {
            case 'auth/email-already-in-use':
              this.errorMessage = 'このメールアドレスは既に使用されています。';
              break;
            case 'auth/invalid-email':
              this.errorMessage = 'メールアドレスの形式が正しくありません。';
              break;
            case 'auth/weak-password':
              this.errorMessage = 'パスワードは6文字以上で設定してください。';
              break;
            default:
              this.errorMessage = '登録に失敗しました。もう一度お試しください。';
          }
        } finally {
          this.loading = false;
        }
      },
      async handlePasswordReset() {
        this.error = false;
        this.loading = true;
        this.resetSuccess = false;
        
        try {
          await sendPasswordResetEmail(this.resetEmail);
          this.resetSuccess = true;
        } catch (error) {
          this.error = true;
          // エラーメッセージの日本語化
          switch(error.code) {
            case 'auth/user-not-found':
              this.errorMessage = 'このメールアドレスに登録されているユーザーが見つかりません。';
              break;
            case 'auth/invalid-email':
              this.errorMessage = 'メールアドレスの形式が正しくありません。';
              break;
            default:
              this.errorMessage = 'パスワードリセットメールの送信に失敗しました。もう一度お試しください。';
          }
        } finally {
          this.loading = false;
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #3f51b5, #f50057);
    padding: 20px;
  }
  
  .login-card {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    padding: 32px;
    position: relative;
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .login-header h1 {
    font-size: 1.8rem;
    color: #3f51b5;
    margin-bottom: 8px;
  }
  
  .tabs {
    display: flex;
    margin-bottom: 24px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .tab {
    padding: 12px 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .tab.active {
    color: #3f51b5;
    border-bottom: 2px solid #3f51b5;
  }
  
  .login-form {
    margin-bottom: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .form-control {
    width: 100%;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-control:focus {
    border-color: #3f51b5;
    outline: none;
  }
  
  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.3s;
  }
  
  .btn-block {
    display: block;
    width: 100%;
  }
  
  .btn-primary {
    background-color: #3f51b5;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #303f9f;
  }
  
  .btn-primary:disabled {
    background-color: #c5cae9;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background-color: #e0e0e0;
    color: #333;
  }
  
  .btn-secondary:hover {
    background-color: #bdbdbd;
  }
  
  .form-footer {
    text-align: center;
    margin-top: 16px;
    font-size: 0.9rem;
  }
  
  .form-footer a {
    color: #3f51b5;
    text-decoration: none;
  }
  
  .alert {
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
  }
  
  .alert-error {
    background-color: rgba(244, 67, 54, 0.1);
    color: #f44336;
    border: 1px solid #f44336;
  }
  
  .alert-success {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4caf50;
    border: 1px solid #4caf50;
  }
  
  .password-reset-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 24px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  
  small {
    color: #757575;
    font-size: 0.8rem;
  }
  </style>