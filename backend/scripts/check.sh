
echo 'Running flake8...'
poetry run flake8

echo 'Running isort...'
poetry run isort . --check-only   # run the Python import sorter

echo 'Running black...'
poetry run black . --check        # runs the Python formatter

echo '✨✨✨✨✨ Completed checks ✨✨✨✨✨'
