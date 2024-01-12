import type { UseFetchOptions } from 'nuxt/app'
import { defu } from 'defu'

export type ApiFetchOptions<T> = UseFetchOptions<T> & {
  excludeInterceptor?: number[]
  onSucess?: (response: {
    status: number
    body: T
  }) => Promise<void> | void
  onError?: (response: {
    status: number
    body: T
  }) => Promise<void> | void
}

export async function useApi<T>(url: string, opts: ApiFetchOptions<T> = {}) {
  const { excludeInterceptor, ...options } = opts

  const nuxtApp = useNuxtApp()

  const defaults: UseFetchOptions<T> = {
    async onRequest({ options }) {
      options.headers = new Headers(options.headers)
      options.headers.set('X-Requested-With', 'XMLHttpRequest')
    },
    async onResponse({ response }) {
      if (typeof opts.onSucess === 'function' && response.status >= 200 && response.status < 300) {
        await opts.onSucess({
          status: response.status,
          body: response._data,
        })
      }
    },

    async onResponseError(ctx) {
      const excludedInterceptor = (statusCode: number): boolean => {
        if (!excludeInterceptor)
          return false

        return excludeInterceptor.includes(statusCode)
      }

      const toast = await nuxtApp.runWithContext(() => useToast())

      if (!excludedInterceptor(ctx.response.status)) {
        if (ctx.response.status === 401) {
          toast.add({
            color: 'red',
            title: 'Session Expired',
            description: 'Your session has expired, please log in.',
          })

          if (typeof window !== 'undefined')
            window.location.reload()
        }

        if (ctx.response.status === 403) {
          toast.add({
            color: 'red',
            title: 'Access Forbiden',
            description: 'Your Account is not permitted to request to some endpoints.',
          })
        }

        if (ctx.response.status >= 500) {
          toast.add({
            color: 'red',
            title: 'Error',
            description: 'We\'re sorry but we\'re having some technical difficulties.',
          })
        }
      }

      if (typeof opts.onError === 'function') {
        await opts.onError({
          status: ctx.response.status,
          body: ctx.response._data,
        })
      }
    },
  }

  const params = defu(options, defaults)

  return await useFetch(url, params)
}
