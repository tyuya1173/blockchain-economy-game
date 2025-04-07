<template>
    <div>
      <v-app-bar app color="primary" dark>
        <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
        
        <div class="d-flex align-center">
          <v-icon large class="mr-2">mdi-ethereum</v-icon>
          <span class="text-h7">ブロックチェーン・エコノミーゲーム</span>
        </div>
    
        <v-spacer></v-spacer>
    
        <v-menu offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn text v-bind="attrs" v-on="on">
              <v-avatar size="32" color="accent" class="mr-2">
                {{ userInitial }}
              </v-avatar>
              {{ userName }}
              <v-icon>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="handleLogout">
              <v-list-item-icon>
                <v-icon>mdi-logout</v-icon>
              </v-list-item-icon>
              <v-list-item-title>ログアウト</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar>
  
      <v-navigation-drawer
        v-model="drawer"
        app
        temporary
      >
        <v-list>
          <v-list-item
            v-for="(item, index) in menuItems"
            :key="index"
            @click="navigateTo(item.route)"
          >
            <v-list-item-icon>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
  
          <v-divider v-if="isAdmin" class="my-2"></v-divider>
  
          <v-list-item 
            v-if="isAdmin"
            @click="navigateTo('/admin')"
          >
            <v-list-item-icon>
              <v-icon>mdi-cog</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>管理者ページ</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </div>
  </template>
  
  <script>
  export default {
    name: 'AppNavigation',
    props: {
      userData: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        drawer: false,
        menuItems: [
          { 
            title: 'ダッシュボード', 
            icon: 'mdi-view-dashboard', 
            route: '/dashboard' 
          },
          { 
            title: 'マイニング', 
            icon: 'mdi-hammer', 
            route: '/mining' 
          },
          { 
            title: '取引', 
            icon: 'mdi-swap-horizontal', 
            route: '/trading' 
          },
          { 
            title: 'マーケット', 
            icon: 'mdi-chart-line', 
            route: '/market' 
          },
          { 
            title: 'プロフィール', 
            icon: 'mdi-account', 
            route: '/profile' 
          }
        ]
      }
    },
    computed: {
      userName() {
        return this.userData ? this.userData.displayName || 'ユーザー' : '';
      },
      userInitial() {
        return this.userName ? this.userName.charAt(0).toUpperCase() : '';
      },
      isAdmin() {
        return this.userData && this.userData.role === 'admin';
      }
    },
    methods: {
      handleLogout() {
        this.$emit('logout');
      },
      navigateTo(route) {
        this.$router.push(route);
        this.drawer = false;
      }
    }
  };
  </script>
  
  <style scoped>
  /* 追加のスタイルが必要な場合はここに記述 */
  </style>