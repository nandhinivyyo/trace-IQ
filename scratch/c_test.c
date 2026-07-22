#include <stdio.h>

int binarySearch(int arr[], int size, int target) {
    int left = 0;
    int right = size - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;
        }
        
        if (arr[mid] < target) {
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }
    return -1;
}

int main() {
    int numbers[] = {1, 3, 5, 7, 9};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    int targetVal = 7;
    
    int result = binarySearch(numbers, size, targetVal);
    printf("Target found at index: %d\n", result);
    return 0;
}
