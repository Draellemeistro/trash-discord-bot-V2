import argparse
import os
import logging
# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
logging.getLogger('tensorflow').setLevel(logging.FATAL)
import random
import re
from face_detector import get_face_detector, find_faces
from face_landmarks import get_landmark_model, detect_marks, draw_marks
import cv2
import numpy as np
from faceScrutinizer import findFaceSize



# Detect faces in the image
# note the number of faces detected
# scale the face bounding box
def replace_special_characters(input_string):
    input_string = re.sub(r'æ', 'ae', input_string)
    input_string = re.sub(r'ø', 'oe', input_string)
    input_string = re.sub(r'å', 'aa', input_string)
    return input_string.capitalize()


def limit_image_size(img_Resize):
    img_height, img_width = img_Resize.shape[:2]
    # Limit the height to 900
    if img_height > 900:
        img_width = int(img_width * 900 / img_height)
        img_height = 900
        img_Resize = cv2.resize(img_Resize, (img_width, img_height))
    return img_Resize


def overlay_placeholder():
    # Construct the absolute path to the model file
    model_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'overlay_bs.png')
    overlay = cv2.imread(model_path, cv2.IMREAD_UNCHANGED)
    return overlay


def load_overlay_img(folder_name):
    folder_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'face_overlays', folder_name)
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"The specified folder was not found: {folder_path}")
    image_files = [file for file in os.listdir(folder_path) if file.endswith(('.png', '.jpg', '.jpeg'))]
    if not image_files:
        raise FileNotFoundError("No image files found in the specified folder.")
    random_image_file = random.choice(image_files)
    path_to_image = os.path.join(folder_path, random_image_file)
    print(f"loading overlay image for {folder_name}")
    try:
        overlay_attempt = cv2.imread(path_to_image, cv2.IMREAD_UNCHANGED)
    except Exception as e:
        print(f"Error loading image: {e}")
        overlay_attempt = overlay_placeholder()
    if overlay_attempt is not None:
        print(f"Overlay loaded for {folder_name}")
        return overlay_attempt


def weigh_faces(mark_img, found_faces, landmark_mdl, accept_faces, overlays):
    # Initialize the index of the largest face to None
    largestFaceIdx = None

    # The most likely face to be correct is the largest face
    largestSize = 0
    largestFace = None
    i = 0
    # Define the indices3 for the left and right eyes
    left = [36, 37, 38, 9, 40, 41]
    right = [42, 43, 44, 45, 46, 47]
    kernel = np.ones((9, 9), np.uint8)

    # For each detected face
    for face in found_faces:
        # Draw the bounding box for the face
        shape = detect_marks(mark_img, landmark_mdl, face)
        # Check if eyes are detected within the face
        left_eye = shape[36:42]
        right_eye = shape[42:48]
        nose = shape[27:36]
        # If eyes are detected, draw the eye landmarks and save the image to a file
        if len(nose) > 0 and (len(left_eye) > 0 or len(right_eye) > 0):
            accept_faces.append(face)
            if len(people) > i:
                loaded_overlay = load_overlay_img(people[i])
                overlays.append(loaded_overlay)
            else:
                overlays.append(overlay_placeholder())
            faceSize = findFaceSize(face)
            if faceSize > largestSize:
                largestSize = faceSize
                largestFaceIdx = i
                largestFace = face
        i = i + 1

    if largestFace is None:
        print("No faces detected")
        return 0

    shape = detect_marks(mark_img, landmark_mdl, found_faces[largestFaceIdx])
    left_eye = shape[36:42]
    right_eye = shape[42:48]
    nose = shape[27:36]
    # Convert the color space from BGR to RGB
    mark_img = cv2.cvtColor(mark_img, cv2.COLOR_BGR2RGB)
    draw_marks(mark_img, left_eye)
    draw_marks(mark_img, right_eye)
    draw_marks(mark_img, nose)
    return accepted_faces, overlays, mark_img


def overlay_all_faces(marked_img_copy, faces_to_do, overlays_to_do):
    overlayed_img = cv2.cvtColor(marked_img_copy, cv2.COLOR_RGB2BGR)
    print("overlaying faces.")

    if len(overlays_to_do) == len(faces_to_do):
        i: int = 0
        for face in faces_to_do:
            overlayed_img = overlay_face(face, overlays_to_do[i], overlayed_img)
            i = i + 1
    else:
        print("\n\n\n!!!!doing second overlay option!!!!")
        i: int = 0
        for overlay in overlays_to_do:
            face = faces_to_do[i]
            overlayed_img = overlay_face(face, overlay, overlayed_img)
            i = i + 1

    if not has_blue_tint(overlayed_img):
        return overlayed_img, None, None
    else:
        print("Image has a blue tint")
        overlayed_img = cv2.cvtColor(overlayed_img, cv2.COLOR_BGR2RGB)
        overlayed_img2 = cv2.addWeighted(overlayed_img, 1.1, np.zeros(overlayed_img.shape, overlayed_img.dtype), 0, 0)
        overlayed_img3 = cv2.cvtColor(overlayed_img2, cv2.COLOR_RGB2BGR)
        return overlayed_img, overlayed_img2, overlayed_img3



def overlay_face(face_to_manipulate, overlay_to_use, new_img):
    # Get the size of the face
    face_width = face_to_manipulate[2] - face_to_manipulate[0]
    face_height = face_to_manipulate[3] - face_to_manipulate[1]
    # Calculate the aspect ratio of the overlay
    overlay_aspect_ratio = overlay_to_use.shape[1] / overlay_to_use.shape[0]

    # Calculate the overlay width and height while maintaining the aspect ratio
    overlay_width = int(face_width * 1.45)  # Increase the multiplier here
    overlay_height = int(overlay_width / overlay_aspect_ratio)

    # Resize the overlay to the size of the face
    overlay_resized = cv2.resize(overlay_to_use, (overlay_width, overlay_height))

    # Calculate the center of the face
    face_center_x = face_to_manipulate[0] + face_width // 2
    face_center_y = face_to_manipulate[1] + face_height // 2

    # Calculate the top-left corner of the overlay to place it at the center of the face
    overlay_start_x = face_center_x - overlay_width // 2
    overlay_start_y = face_center_y - overlay_height // 2

    # Calculate the end coordinates of the overlay
    overlay_end_x = overlay_start_x + overlay_resized.shape[1]
    overlay_end_y = overlay_start_y + overlay_resized.shape[0]

    # Ensure the overlay does not exceed the image boundaries
    overlay_start_x = max(0, overlay_start_x)
    overlay_start_y = max(0, overlay_start_y)
    overlay_end_x = min(new_img.shape[1], overlay_end_x)
    overlay_end_y = min(new_img.shape[0], overlay_end_y)

    # Place the overlay on the original image
    alpha_s = overlay_resized[:, :, 3] / 255.0
    alpha_l = 1.0 - alpha_s
    for c in range(0, 3):
        new_img[overlay_start_y:overlay_start_y + overlay_height,
        overlay_start_x:overlay_start_x + overlay_width,
        c] = \
            (alpha_s * overlay_resized[:, :, c] +
             alpha_l * new_img[overlay_start_y:overlay_start_y + overlay_height,
                       overlay_start_x:overlay_start_x + overlay_width, c])

    return new_img

def has_blue_tint(img_to_test):
    # Split the image into Blue, Green, and Red channels
    blue_channel, green_channel, red_channel = cv2.split(img_to_test)

    # Calculate the average intensity of each channel
    avg_blue = np.mean(blue_channel)
    avg_green = np.mean(green_channel)
    avg_red = np.mean(red_channel)

    # Check if the Blue channel has a higher average intensity than the Green and Red channels
    return avg_blue > avg_green and avg_blue > avg_red

def display_help():
    help_text = """
    Usage:
    python putFacesOn.py [overlay] [image_path] [overlay_choice], [overlay_choice], ...

    This script processes an image and overlays faces.

    Arguments:
    people - Lists all possible people that can be used as overlay choices.
    Help - Displays this help text.
    overlay - Processes the image and overlays the faces.
    """
    print(help_text)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process an image and overlay faces.')
    parser.add_argument('command', type=str, help='Command to execute')
    parser.add_argument('image_path', type=str, nargs='?', help='Path to the image file')
    parser.add_argument('overlay_choices', type=str, nargs='*', help='names of the people to use as overlay images')
    args = parser.parse_args()
    if args.command == 'help':
        display_help()
        exit(0)
    elif args.command == 'people':
        additional_strings = os.listdir("./face_overlays")
        print("People availabe for overlays:")
        for string in additional_strings:
            print(string)
        exit(0)
    elif args.command == 'overlay':
        pass
    else:
        print("Invalid command. Use 'help' for usage information.")
        exit(1)

    # python putFacesOn.py image.jpg Alice Bob Charlie

    img_path = args.image_path
    additional_strings = [replace_special_characters(s) for s in args.overlay_choices]
    dir_path = os.path.dirname(os.path.realpath(__file__))

    people = []
    face_overlays_path = os.path.join(dir_path, 'face_overlays')
    possible_people = os.listdir(face_overlays_path)
    # Process additional strings as needed
    for string in additional_strings:
        print(f"Processing string: {string}")
        if string in possible_people:
            people.append(string)
        else:
            print(f"Could not find {string} in the face_overlays folder.")

    face_model = get_face_detector()
    landmark_model = get_landmark_model()
    img = cv2.imread(img_path)
    marked_img = img.copy()
    accepted_faces = []
    overlay_faces = []
    faces = find_faces(img, face_model)
    accepted_faces, overlay_faces, marked_img = weigh_faces(
        marked_img,
        faces,
        landmark_model,
        accepted_faces,
        overlay_faces
    )
    return_img, return_img2, return_img3 = overlay_all_faces(marked_img, accepted_faces, overlay_faces)
    output_path = "output.jpg"
    cv2.imwrite(output_path, return_img)
    # Print the path of the newly written image file
    print(output_path)
    print(f"Saving to {output_path}")
    print("absolute path of img: " os.path.abspath("output.jpg"))
        if os.path.isfile("output.jpg"):
            print("Saving image")
        else:
            counter = 0
            while not os.path.isfile("output.jpg"):
                print("Image not saved")
                cv2.imwrite("output.jpg", return_img)
                counter += 1
                if counter > 4:
                    print("uuhhhh... I'm out.")
                    break
    if return_img2 is not None:
        cv2.imwrite("output2.jpg", return_img2)
        cv2.imwrite("output3.jpg", return_img3)
