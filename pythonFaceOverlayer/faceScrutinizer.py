
def findFaceSize(face):
    # Calculate the size of the face
    face_size = (face[2] - face[0]) * (face[3] - face[1])
    return face_size

def findLargestFace(faces):
    # Initialize the index of the largest face to None
    largest_face_idx = None
    largest_face_size = 0

    # For each detected face
    for i, face in enumerate(faces):
        # Calculate the size of the face
        face_size = findFaceSize(face)

        # If this face is larger than the largest face so far
        if face_size > largest_face_size:
            # Update the largest face size and index
            largest_face_size = face_size
            largest_face_idx = i

    return largest_face_idx