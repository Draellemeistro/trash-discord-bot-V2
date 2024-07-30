import numpy as np
import cv2
import argparse
import os

face_cascade = cv2.CascadeClassifier('xml/face.xml')
specs_ori = cv2.imread('assets/glasses.png', -1)
cigar_ori = cv2.imread('assets/joint.png', -1)


###########
# 'Change video capture to be single image, perhaps??'
###########
# 'or maybe let the program decide if it is a video or image'


def transparentOverlay(src, overlay, pos=(0, 0), scale=1):
    overlay = cv2.resize(overlay, (0, 0), fx=scale, fy=scale)
    h, w, _ = overlay.shape  # Size of foreground
    rows, cols, _ = src.shape  # Size of background Image
    y, x = pos[0], pos[1]  # Position of foreground/overlay image

    # loop over all pixels and apply the blending equation
    for i in range(h):
        for j in range(w):
            if x + i >= rows or y + j >= cols:
                continue
            alpha = float(overlay[i][j][3] / 255.0)  # read the alpha channel
            src[x + i][y + j] = alpha * overlay[i][j][:3] + (1 - alpha) * src[x + i][y + j]
    return src


def manipulate_frame(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(frame, 1.2, 5, 0, (120, 120), (350, 350))
    for (x, y, w, h) in faces:
        if h > 0 and w > 0:
            glass_symin = int(y + 1.5 * h / 5)
            glass_symax = int(y + 2.5 * h / 5)
            sh_glass = glass_symax - glass_symin

            cigar_symin = int(y + 4 * h / 6)
            cigar_symax = int(y + 5.5 * h / 6)
            sh_cigar = cigar_symax - cigar_symin

            face_glass_roi_color = frame[glass_symin:glass_symax, x:x + w]
            face_cigar_roi_color = frame[cigar_symin:cigar_symax, x:x + w]

            specs = cv2.resize(specs_ori, (w, sh_glass), interpolation=cv2.INTER_CUBIC)
            cigar = cv2.resize(cigar_ori, (w, sh_cigar), interpolation=cv2.INTER_CUBIC)
            transparentOverlay(face_glass_roi_color, specs)
            transparentOverlay(face_cigar_roi_color, cigar, (int(w / 2), int(sh_cigar / 2)))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Process an image or video and overlay faces.')
    parser.add_argument('image_path', type=str, nargs='?', help='Path to the image file or video file.')
    args = parser.parse_args()
    file_path = args.file_path
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext in ['.jpg', '.jpeg', '.png']:
        img = cv2.imread(file_path)
        manipulate_frame(img)
        cv2.imwrite('coolOut'+file_ext, img)
    elif file_ext in ['.mp4', '.avi', '.mov']:
        cap = cv2.VideoCapture(file_path)
        fps = 30  # Frames per second
        cap.set(cv2.CAP_PROP_FPS, fps)
        frames = []
        output_file = 'coolOut'+file_ext
        fourcc = cv2.VideoWriter_fourcc(*'XVID')

        ret, img = cap.read()
        frame_size = (frames[0].shape[1], frames[0].shape[0])  # Width and height of the frames
        out = cv2.VideoWriter(output_file, fourcc, fps, frame_size)
        manipulate_frame(img)
        out.write(img)
        while True:
            if not ret:
                break
            manipulate_frame(img)
            out.write(img)
        out.release()
        cap.release()
    else:
        print('Invalid file type. Please provide a valid image or video file.')
        exit(1)
