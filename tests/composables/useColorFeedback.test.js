import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useColorFeedback } from '@/composables/useColorFeedback'

describe('useColorFeedback', () => {
  let colorFeedback
  let mockFeedbackManager

  beforeEach(() => {
    colorFeedback = useColorFeedback()
    mockFeedbackManager = {
      showFeedbackForColor: vi.fn()
    }
  })

  it('handles color feedback correctly', () => {
    const mockColorMatch = {
      color: '#FF0000',
      parent: {
        name: 'Red',
        hex: '#FF0000',
        distance: 2.1
      }
    }

    colorFeedback.handleColorFeedback(mockColorMatch, mockFeedbackManager)
    
    expect(mockFeedbackManager.showFeedbackForColor).toHaveBeenCalledWith(mockColorMatch)
  })

  it('handles null color match gracefully', () => {
    colorFeedback.handleColorFeedback(null, mockFeedbackManager)
    
    expect(mockFeedbackManager.showFeedbackForColor).not.toHaveBeenCalled()
  })

  it('handles missing feedback manager gracefully', () => {
    const mockColorMatch = {
      color: '#FF0000',
      parent: { name: 'Red', hex: '#FF0000' }
    }

    // Should not throw error
    expect(() => {
      colorFeedback.handleColorFeedback(mockColorMatch, null)
    }).not.toThrow()
  })

  it('updates color match based on feedback', () => {
    const mockFeedback = {
      originalColor: '#FF0000',
      correction: {
        parentName: 'Crimson Red',
        parentHex: '#DC143C'
      },
      colorInfo: {
        distances: { deltaE: 1.5 }
      }
    }

    const mockActivePreset = { value: null }
    const mockActivePresetImages = { value: [] }
    const mockProcessedImages = {
      value: [{
        name: 'test-image',
        colors: [{
          color: '#FF0000',
          parent: { name: 'Red', hex: '#FF0000' }
        }]
      }]
    }
    const mockShowNotification = vi.fn()

    colorFeedback.updateCurrentColorMatch(
      mockFeedback,
      mockActivePreset,
      mockActivePresetImages,
      mockProcessedImages,
      mockShowNotification
    )

    expect(mockShowNotification).toHaveBeenCalledWith(
      'Color match updated successfully!',
      'success'
    )
  })

  it('handles image selection', () => {
    const mockImage = {
      name: 'test-image.jpg',
      colors: []
    }

    colorFeedback.handleSelectImage(mockImage)
    
    expect(colorFeedback.selectedImage.value).toEqual(mockImage)
  })
})
