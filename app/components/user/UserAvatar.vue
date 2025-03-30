<template>
  <div class="flex gap-2">
    <span>
      <UAvatar :src="userInfo?.picture" />
    </span>
    <span class="font-bold">{{ userInfo?.display_name }}</span>
  </div>
</template>

<script setup lang="ts">
const { getUserInfo } = useNostrUser();

const userInfo = ref(null);

const props = defineProps({
  pubkey: {
    type: String,
    required: true,
  },
});
// get user avatar

async function loadAvatar() {
  const user = await getUserInfo(props.pubkey);
  console.log(user);
  userInfo.value = user;
}

onMounted(() => {
  loadAvatar();
});
</script>
