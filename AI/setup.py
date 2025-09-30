from setuptools import find_packages,setup 
import os
from typing import List

def get_requirements(file_path:str, )->List[str]:
    ''' function returns list of requirements'''

    requirements = []
    with open(file_path) as file_obj:
        requirements = file_obj.readlines()
        requirements = [req.replace("\n","") for req in requirements]

        if "-e ." in requirements:
            requirements.remove("-e .")

    

setup(
    name='HydroForecast',
    version='0.0.1',
    author='Tejas',
    author_email='tejaskadam209@gmail.com',
    packages=find_packages(),
    install_requires=get_requirements('requirements.txt')

    


)


#in whatever folder __Init__ is presnt itd autoamtaically detect and build it 
#-e . automatically runs setup.py