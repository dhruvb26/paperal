import { storeCitation } from '@/app/actions/citation'
import { env } from '@/env'
import { Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import axios from 'axios'

function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        try {
          const output = callback(...args)
          resolve(output)
        } catch (err) {
          reject(err)
        }
      }, delay)
    }).catch((error) => {
      console.error('Error in debounced function:', error)
      throw error
    })
  }
}

interface CallbackInput {
  text: string
  is_referenced: boolean
  citations?: {
    'in-text'?: string
    'after-text'?: string
  }
  context?: string
  href?: string
}

export const AiAutocompleteExtension = Node.create<
  {
    applySuggestionKey: string
    suggestionDebounce: number
  },
  {
    getSuggestion:
      | ((
          previousText: string,
          cb: (suggestion: string | null) => void
        ) => void)
      | undefined
    suggestion: string | null
  }
>({
  name: 'ai-autocomplete',
  priority: 101,
  addOptions() {
    return {
      applySuggestionKey: 'ArrowRight',
      suggestionDebounce: 1000,
      previousTextLength: 4000,
    }
  },
  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<DecorationSet>('suggestion')

    const getSuggestion = debounce(
      async (
        previousText: string,
        cb: (suggestion: string | null, data?: CallbackInput) => void
      ) => {
        try {
          const response = await axios.post(
            `${env.NEXT_PUBLIC_API_URL}/generate`,
            {
              query: previousText,
            }
          )

          const data = response.data.data.response as CallbackInput
          cb(data.text, data)
        } catch (error) {
          cb(null)
        }
      },
      this.options.suggestionDebounce
    )

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldValue) {
            if (tr.getMeta(pluginKey)) {
              const { decorations } = tr.getMeta(pluginKey)
              return decorations
            }
            return tr.docChanged ? oldValue.map(tr.mapping, tr.doc) : oldValue
          },
        },
        view(editorView) {
          setTimeout(() => {
            const previousText = editorView.state.doc
              .textBetween(0, editorView.state.doc.content.size, ' ')
              .slice(-4000)

            getSuggestion(previousText, (suggestion, data) => {
              if (!suggestion || !data) return
              createAndDispatchSuggestion(
                editorView,
                suggestion,
                data,
                pluginKey,
                getSuggestion
              )
            })
          }, 0)

          return {
            update(view, prevState) {
              // Add check for @ and / triggers
              const lastChar = view.state.doc.textContent.slice(-1)
              if (lastChar === '@' || lastChar === '/') {
                return
              }

              const selection = view.state.selection
              const cursorPos = selection.$head.pos
              const nextNode = view.state.doc.nodeAt(cursorPos)

              if (
                nextNode &&
                !nextNode.isBlock &&
                pluginKey.getState(view.state)?.find().length &&
                prevState &&
                !prevState.selection.eq(view.state.selection) // Only clear if selection changed
              ) {
                const tr = view.state.tr
                tr.setMeta('addToHistory', false)
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty })
                view.dispatch(tr)
                return
              }

              // If the document didn't change, do nothing
              if (prevState && prevState.doc.eq(view.state.doc)) {
                return
              }

              // reset the suggestion before fetching a new one
              setTimeout(() => {
                const tr = view.state.tr
                tr.setMeta('addToHistory', true)
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty })
                view.dispatch(tr)
              }, 0)

              // fetch a new suggestion
              const previousText = view.state.doc
                .textBetween(0, view.state.doc.content.size, ' ')
                .slice(-4000)
              getSuggestion(previousText, (suggestion, data) => {
                if (!suggestion || !data) return

                const updatedState = view.state

                const cursorPos = updatedState.selection.$head.pos
                const nextNode = view.state.doc.nodeAt(cursorPos)
                const suggestionDecoration = Decoration.widget(
                  cursorPos,
                  () => {
                    const container = document.createElement('span')
                    container.classList.add('autocomplete-suggestion-container')

                    const suggestionSpan = document.createElement('span')
                    const addSpace = nextNode && nextNode.isText ? ' ' : ''
                    if (data.citations?.['in-text']) {
                      // Remove trailing period if present and format with citation
                      const text = suggestion.replace(/\.$/, '')
                      suggestionSpan.innerHTML = `${addSpace}${text} ${data.citations['in-text']}.`
                    } else {
                      suggestionSpan.innerHTML = `${addSpace}${suggestion}`
                    }
                    suggestionSpan.classList.add('autocomplete-suggestion')
                    suggestionSpan.setAttribute(
                      'data-response-data',
                      JSON.stringify(data)
                    )

                    const shortcuts = document.createElement('div')
                    shortcuts.classList.add('autocomplete-shortcuts')

                    const acceptButton = document.createElement('button')
                    acceptButton.innerHTML = '→ to accept'
                    acceptButton.classList.add('shortcut-button')
                    acceptButton.onclick = (e) => {
                      e.preventDefault()
                      handleSuggestionAcceptance(
                        view,
                        suggestionSpan,
                        pluginKey
                      )
                    }

                    const newSuggestionButton = document.createElement('button')
                    newSuggestionButton.innerHTML = 'Shift + → for new'
                    newSuggestionButton.classList.add('shortcut-button')
                    newSuggestionButton.onclick = (e) => {
                      e.preventDefault()
                      const previousText = view.state.doc
                        .textBetween(0, view.state.doc.content.size, ' ')
                        .slice(-4000)

                      const clearTr = view.state.tr
                      clearTr.setMeta(pluginKey, {
                        decorations: DecorationSet.empty,
                      })
                      view.dispatch(clearTr)

                      getSuggestion(previousText, (newSuggestion, newData) => {
                        if (!newSuggestion || !newData) return
                        createAndDispatchSuggestion(
                          view,
                          newSuggestion,
                          newData,
                          pluginKey,
                          getSuggestion
                        )
                      })
                    }

                    shortcuts.appendChild(acceptButton)
                    shortcuts.appendChild(newSuggestionButton)
                    container.appendChild(suggestionSpan)
                    container.appendChild(shortcuts)
                    return container
                  },
                  { side: 1 }
                )

                const decorations = DecorationSet.create(updatedState.doc, [
                  suggestionDecoration,
                ])
                const tr = view.state.tr
                tr.setMeta('addToHistory', false)
                tr.setMeta(pluginKey, { decorations })
                view.dispatch(tr)
              })
            },
          }
        },
        props: {
          decorations(editorState) {
            return pluginKey.getState(editorState)
          },
          handleKeyDown(view, event) {
            // Handle suggestion acceptance with ArrowRight
            if (event.key === 'ArrowRight' && !event.shiftKey) {
              const decorationSet = pluginKey.getState(view.state)
              if (decorationSet?.find().length) {
                const suggestionEl = document.querySelector(
                  '.autocomplete-suggestion'
                ) as HTMLElement
                if (suggestionEl) {
                  handleSuggestionAcceptance(view, suggestionEl, pluginKey)
                  event.preventDefault()
                  return true
                }
              }
            }

            // Handle new suggestion request with Shift + ArrowRight
            if (event.key === 'ArrowRight' && event.shiftKey) {
              const previousText = view.state.doc
                .textBetween(0, view.state.doc.content.size, ' ')
                .slice(-4000)

              // Reset current suggestion
              const clearTr = view.state.tr
              clearTr.setMeta(pluginKey, { decorations: DecorationSet.empty })
              view.dispatch(clearTr)

              // Request new suggestion
              getSuggestion(previousText, (suggestion, data) => {
                if (!suggestion || !data) return
                createAndDispatchSuggestion(
                  view,
                  suggestion,
                  data,
                  pluginKey,
                  getSuggestion
                )
              })

              event.preventDefault()
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})

function createAndDispatchSuggestion(
  view: any,
  suggestion: string,
  data: CallbackInput,
  pluginKey: PluginKey,
  getSuggestion: (
    previousText: string,
    cb: (suggestion: string | null, data?: CallbackInput) => void
  ) => void
) {
  const cursorPos = view.state.selection.$head.pos
  const nextNode = view.state.doc.nodeAt(cursorPos)
  const suggestionDecoration = Decoration.widget(
    cursorPos,
    () => {
      const container = document.createElement('span')
      container.classList.add('autocomplete-suggestion-container')

      const suggestionSpan = document.createElement('span')
      const addSpace = nextNode && nextNode.isText ? '' : ''
      if (data.citations?.['in-text']) {
        const text = suggestion.replace(/\.$/, '')
        suggestionSpan.innerHTML = `${addSpace}${text} ${data.citations['in-text']}.`
      } else {
        suggestionSpan.innerHTML = `${addSpace}${suggestion}`
      }
      suggestionSpan.classList.add('autocomplete-suggestion')
      suggestionSpan.setAttribute('data-response-data', JSON.stringify(data))

      const shortcuts = document.createElement('div')
      shortcuts.classList.add('autocomplete-shortcuts')

      const acceptButton = document.createElement('button')
      acceptButton.innerHTML = '→ to accept'
      acceptButton.classList.add('shortcut-button')
      acceptButton.onclick = (e) => {
        e.preventDefault()
        handleSuggestionAcceptance(view, suggestionSpan, pluginKey)
      }

      const newSuggestionButton = document.createElement('button')
      newSuggestionButton.innerHTML = 'Shift + → for new'
      newSuggestionButton.classList.add('shortcut-button')
      newSuggestionButton.onclick = (e) => {
        e.preventDefault()
        const previousText = view.state.doc
          .textBetween(0, view.state.doc.content.size, ' ')
          .slice(-4000)

        const clearTr = view.state.tr
        clearTr.setMeta(pluginKey, { decorations: DecorationSet.empty })
        view.dispatch(clearTr)

        getSuggestion(previousText, (newSuggestion, newData) => {
          if (!newSuggestion || !newData) return
          createAndDispatchSuggestion(
            view,
            newSuggestion,
            newData,
            pluginKey,
            getSuggestion
          )
        })
      }

      shortcuts.appendChild(acceptButton)
      shortcuts.appendChild(newSuggestionButton)
      container.appendChild(suggestionSpan)
      container.appendChild(shortcuts)
      return container
    },
    { side: 1 }
  )

  const decorations = DecorationSet.create(view.state.doc, [
    suggestionDecoration,
  ])
  const tr = view.state.tr
  tr.setMeta('addToHistory', false)
  tr.setMeta(pluginKey, { decorations })
  view.dispatch(tr)
}

async function handleSuggestionAcceptance(
  view: any,
  suggestionEl: HTMLElement,
  pluginKey: PluginKey
) {
  const tr = view.state.tr
  const responseData = JSON.parse(
    suggestionEl.getAttribute('data-response-data') || '{}'
  )

  const pathDocumentId = window.location.pathname.split('/editor/')[1]
  if (responseData.citations?.['in-text']) {
    const schema = view.state.schema
    const text = responseData.text.replace(/\.$/, '')
    const citationText = responseData.citations['in-text']

    tr.replaceWith(tr.selection.from, tr.selection.from, [
      schema.text(text + ' '),
      schema.text(citationText, [
        schema.marks.link.create({
          href: responseData.href,
        }),
      ]),
      schema.text('. '),
    ])

    try {
      await storeCitation({
        documentId: pathDocumentId,
        sentence: text,
        citation: citationText,
        context: responseData.context || '',
      })
    } catch (error) {
      console.error('Failed to store citation:', error)
    }
  } else {
    tr.insertText((suggestionEl.textContent || '') + ' ')
  }

  view.dispatch(tr)

  const clearTr = view.state.tr
  clearTr.setMeta(pluginKey, {
    decorations: DecorationSet.empty,
  })
  view.dispatch(clearTr)

  // Add new suggestion request after acceptance
  setTimeout(() => {
    const previousText = view.state.doc
      .textBetween(0, view.state.doc.content.size, ' ')
      .slice(-4000)

    // Get getSuggestion function from the plugin
    const plugin = view.state.plugins.find((p: any) => p.key === pluginKey)
    if (plugin && plugin.spec.view) {
      const getSuggestion = plugin.spec.view(view).props.getSuggestion
      if (getSuggestion) {
        getSuggestion(
          previousText,
          (suggestion: string | null, data: CallbackInput | undefined) => {
            if (!suggestion || !data) return
            createAndDispatchSuggestion(
              view,
              suggestion,
              data,
              pluginKey,
              getSuggestion
            )
          }
        )
      }
    }
  }, 0)

  return true
}
